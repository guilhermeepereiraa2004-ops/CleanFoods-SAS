// Origin coordinates: Avenida Nazaré 683, Ipiranga, São Paulo
const ORIGIN_LAT = -23.5937;
const ORIGIN_LNG = -46.6100;

function applyPricing(distanceInKm) {
    let fee = 0;
    window.outOfRange = false;

    // Apply pricing table
    if (distanceInKm <= 5) fee = 18.00;
    else if (distanceInKm <= 10) fee = 25.00;
    else if (distanceInKm <= 15) fee = 35.00;
    else if (distanceInKm <= 20) fee = 46.00;
    else if (distanceInKm <= 30) fee = 55.00;
    else {
        window.outOfRange = true;
        fee = 0;
    }

    window.dynamicShippingFee = fee;
    window.dynamicShippingDistance = distanceInKm;

    // Trigger global cart update
    if (typeof renderCart === 'function') renderCart();
    if (typeof updateCartBadges === 'function') updateCartBadges();
}

async function calculateDistanceAndFreight(destLat, destLng) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${ORIGIN_LNG},${ORIGIN_LAT};${destLng},${destLat}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
            const distanceInKm = data.routes[0].distance / 1000;
            applyPricing(distanceInKm);
        } else {
            console.error("OSRM Route failed", data);
        }
    } catch (err) {
        console.error("OSRM Fetch Error", err);
    }
}

async function calculateDistanceByAddress(addressString) {
    try {
        const query = encodeURIComponent(addressString);
        const url = `https://photon.komoot.io/api/?q=${query}&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
            const lng = parseFloat(data.features[0].geometry.coordinates[0]);
            const lat = parseFloat(data.features[0].geometry.coordinates[1]);
            calculateDistanceAndFreight(lat, lng);
        }
    } catch (err) {
        console.error("Geocoding Fetch Error", err);
    }
}

// Support for ViaCEP when user types CEP manually
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('client-cep')) {
        let cep = e.target.value.replace(/\D/g, '');
        
        // Mask CEP
        if (cep.length > 5) {
            e.target.value = cep.substring(0, 5) + '-' + cep.substring(5, 8);
        }
        
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(res => res.json())
                .then(data => {
                    if (!data.erro) {
                        const form = e.target.closest('form');
                        if (!form) return;
                        
                        const ruaInput = form.querySelector('.client-rua-autocomplete');
                        const bairroInput = form.querySelector('.client-bairro');
                        const cidadeUfInput = form.querySelector('.client-cidade-uf');
                        const numeroInput = form.querySelector('.client-numero');
                        
                        if (ruaInput) ruaInput.value = data.logradouro;
                        if (bairroInput) bairroInput.value = data.bairro;
                        if (cidadeUfInput) cidadeUfInput.value = `${data.localidade} - ${data.uf}`;
                        
                        if (numeroInput) numeroInput.focus();

                        // Try to calculate distance from ViaCEP result
                        // Using CEP instead of neighborhood gives much higher accuracy in Photon
                        const destStr = `${data.logradouro}, ${cep}, ${data.localidade}, ${data.uf}, Brasil`;
                        calculateDistanceByAddress(destStr);
                    }
                })
                .catch(err => console.error("Erro ao buscar CEP", err));
        }
    }
});

// Calculate distance when user manually types address and leaves the input
document.addEventListener('blur', function(e) {
    const isAddressField = e.target.classList.contains('client-numero') || 
                           e.target.classList.contains('client-rua-autocomplete') || 
                           e.target.classList.contains('client-bairro');
                           
    if (isAddressField) {
        const form = e.target.closest('form');
        if (!form) return;
        
        const rua = form.querySelector('.client-rua-autocomplete')?.value.trim();
        const numero = form.querySelector('.client-numero')?.value.trim();
        const bairro = form.querySelector('.client-bairro')?.value.trim();
        const cidade = form.querySelector('.client-cidade-uf')?.value.trim();
        
        // If they filled enough manual info, calculate it
        if (rua && cidade) {
            // Avoid using bairro here too, to prevent false matches in Photon
            const destStr = `${rua}, ${cidade}, Brasil`;
            calculateDistanceByAddress(destStr);
        }
    }
}, true);
