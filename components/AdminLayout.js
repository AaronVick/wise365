export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-lg font-bold">Admin Panel</h1>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
      <footer className="bg-gray-800 text-white text-center py-2 mt-4">
        <p>&copy; {new Date().getFullYear()} Business Wise365. All rights reserved.</p>
      </footer>
    </div>
  );
}
