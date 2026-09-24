import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-cf-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="font-impact text-6xl text-cf-yellow uppercase mb-4 tracking-widest text-center">
        CleanFoods SaaS
      </h1>
      <p className="text-xl text-gray-400 mb-12 text-center max-w-2xl font-body">
        A plataforma multi-tenant para a rede de franquias CleanFoods.
      </p>

      <div className="flex gap-4">
        <Link 
          href="/master" 
          className="bg-cf-yellow text-cf-black font-bold uppercase px-8 py-4 text-xl torn-edge hover:opacity-90 transition-opacity"
        >
          Acessar Master Admin
        </Link>
        <Link 
          href="/demo" 
          className="bg-transparent border-2 border-cf-yellow text-cf-yellow font-bold uppercase px-8 py-4 text-xl torn-edge hover:bg-cf-yellow hover:text-cf-black transition-colors"
        >
          Ver Loja Demo
        </Link>
      </div>
    </div>
  );
}
