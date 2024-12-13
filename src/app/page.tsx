import { BackgroundLines } from "@/components/ui/background-lines";

export default async function Home() {
  return (
    <BackgroundLines className="flex min-h-screen w-full flex-col items-center justify-center">
      <main className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#165985] to-[#0c2c47] text-white">
        <div className="flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="z-10 text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Coming Soon
          </h1>
        </div>
      </main>
    </BackgroundLines>
  );
}
