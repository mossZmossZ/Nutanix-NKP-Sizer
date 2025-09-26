import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Dropdown button */}
      <button
        onClick={() => setOpen(!open)}
        className="border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-100 focus:outline-none"
      >
        {label}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-50">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [projectName, setProjectName] = useState("Untitled Project");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* NAVBAR */}
      <header className="bg-[#232A31] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wide">NKP Sizer</h1>
        <nav className="flex gap-6 text-sm">
          <a href="#" className="hover:text-gray-300">
            Dashboard
          </a>
          <a href="#" className="hover:text-gray-300">
            Projects
          </a>
          <a href="#" className="hover:text-gray-300">
            Help
          </a>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-6 py-6">
        {/* PROJECT HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-2xl font-semibold bg-transparent border-b border-gray-300 focus:outline-none focus:border-indigo-500 px-1"
            />
            <span className="text-sm text-gray-500">Editable Project Name</span>
          </div>

          {/* DROPDOWNS */}
          <div className="flex gap-3">
            <Menu as="div" className="relative inline-block">
              <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-gray-100/10 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100/20">
                BOM
                <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
              </MenuButton>
              <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-gray-800 shadow-lg focus:outline-none">
                <div className="py-1">
                  <MenuItem>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`block px-4 py-2 text-sm ${
                          active ? "bg-gray-700 text-white" : "text-gray-300"
                        }`}
                      >
                        Download
                      </a>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>

            <Menu as="div" className="relative inline-block">
              <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-gray-100/10 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100/20">
                More
                <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
              </MenuButton>
              <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-gray-800 shadow-lg focus:outline-none">
                <div className="py-1">
                  <MenuItem>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`block px-4 py-2 text-sm ${
                          active ? "bg-gray-700 text-white" : "text-gray-300"
                        }`}
                      >
                        Share
                      </a>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>


        </div>

        {/* BODY PLACEHOLDER */}
        <div className="mt-6">
          <p className="text-gray-600">
            Here’s where the sizing modules (Management, Prod, Non-Prod, DR) will
            go — styled in a Nutanix table/section format instead of cards.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
