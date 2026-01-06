export default function ProductList() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Productos</h1>
            <p className="text-gray-600 mb-6">Gestiona tu menú y precios</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2">✅ Componente ProductList Cargado</h2>
                <p className="text-gray-700">
                    Si ves esto, el componente ProductList se está renderizando correctamente.
                </p>
                <p className="mt-4 text-sm text-gray-600">
                    Próximo paso: Agregar el hook useProducts gradualmente para identificar el problema.
                </p>
            </div>
        </div>
    );
}
