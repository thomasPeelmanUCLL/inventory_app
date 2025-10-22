import React from 'react';

interface HomePageInformationProps {
  language: 'en' | 'es';
}

const HomePageInformation: React.FC<HomePageInformationProps> = ({ language }) => {
  const text = {
    en: {
      title: "Inventory Management",
      paragraph1: "Welcome to our Inventory Management System, a powerful tool designed to help you track and manage your inventory efficiently.",
      paragraph2: "Our platform allows you to create inventories, add items, track quantities, and monitor sales to ensure you always have the right products in stock.",
      paragraph3: "Use our comprehensive inventory management system to help you keep track of your items and equipment. Visit our Inventory page to manage your collections efficiently."
    },
    es: {
      title: "Gestión de Inventario",
      paragraph1: "Bienvenido a nuestro Sistema de Gestión de Inventario, una herramienta potente diseñada para ayudarte a rastrear y administrar tu inventario de manera eficiente.",
      paragraph2: "Nuestra plataforma te permite crear inventarios, agregar artículos, rastrear cantidades y monitorear ventas para asegurarte de tener siempre los productos correctos en stock.",
      paragraph3: "Utiliza nuestro sistema integral de gestión de inventario para ayudarte a realizar un seguimiento de tus artículos y equipos. Visita nuestra página de Inventario para gestionar tus colecciones de manera eficiente."
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row items-start gap-12 p-10 bg-gray-50 min-h-screen">
      {/* Text Section */}
      <div className="md:w-1/3 space-y-6 p-8 bg-gray-100 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800">{text[language].title}</h1>
        <p className="text-gray-700 leading-relaxed">
          {text[language].paragraph1}
        </p>
        <p className="text-gray-700 leading-relaxed">
          {text[language].paragraph2}
        </p>
        <p className="text-gray-700 leading-relaxed">
          {text[language].paragraph3}
        </p>
        <a href="/Inventory" className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out">
          {language === 'en' ? 'Go to Inventory' : 'Ir al Inventario'}
        </a>
      </div>

      {/* Image Section */}
      <div className="md:w-2/3 flex items-center justify-center relative mt-8">
        <div className="bg-blue-100 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Efficient Inventory Management</h2>
          <p className="text-blue-700 mb-4">Track your items, monitor stock levels, and manage sales with our easy-to-use system.</p>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md mx-2">
              <h3 className="font-bold text-blue-600">Create</h3>
              <p>Add new inventories</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md mx-2">
              <h3 className="font-bold text-blue-600">Track</h3>
              <p>Monitor your items</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md mx-2">
              <h3 className="font-bold text-blue-600">Manage</h3>
              <p>Handle sales efficiently</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageInformation;
