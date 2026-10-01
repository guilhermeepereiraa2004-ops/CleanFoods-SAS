import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-cf-black text-white flex flex-col items-center justify-center px-4 py-8 sm:p-8">
      <h1 className="font-impact text-4xl sm:text-6xl text-cf-yellow uppercase mb-4 tracking-wide sm:tracking-widest text-center break-words">
        CleanFoods SaaS
      </h1>
      <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-12 text-center max-w-2xl font-body">
        A plataforma multi-tenant para a rede de franquias CleanFoods.
      </p>

      <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
        <Link 
          href="/master" 
          className="bg-cf-yellow text-cf-black font-bold uppercase px-5 sm:px-8 py-4 text-base sm:text-xl text-center torn-edge hover:opacity-90 transition-opacity"
        >
          Acessar Master Admin
        </Link>
        <Link 
          href="/demo" 
          className="bg-transparent border-2 border-cf-yellow text-cf-yellow font-bold uppercase px-5 sm:px-8 py-4 text-base sm:text-xl text-center torn-edge hover:bg-cf-yellow hover:text-cf-black transition-colors"
        >
          Ver Loja Demo
        </Link>
      </div>
    </div>
  );
}
