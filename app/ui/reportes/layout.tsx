import BottomNav from "./_components/nav/bottom-nav";
import TopNav from "./_components/nav/top-nav";

export default function ReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav className="animate-fade-down animate-ease-in-out" />
      <div className='flex-1 flex items-start justify-center w-full
                px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8
                py-0 lg:py-0
                overflow-y-auto overflow-x-hidden'>
        {children}
      </div>
      <BottomNav className="animate-fade-up animate-ease-in-out" />
    </>
  );
}
