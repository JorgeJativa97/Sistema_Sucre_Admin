
export default function Home() {
  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Welcome to Dashboard
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This is a simplified version of the dashboard home page.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
