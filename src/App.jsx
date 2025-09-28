import { useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import WorkloadPage from "./components/WorkloadPage";
import SolutionPage from "./components/SolutionPage";

const DEFAULT_PROJECT_NAME = "Untitled Project";
const PROJECT_NAME_STORAGE_KEY = "projectName";

// ---------------- Project Name Component ----------------
function ProjectName({ projectName, onUpdateProjectName }) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  const saveName = () => {
    onUpdateProjectName(tempName);
    setEditing(false);
  };

  const cancelEdit = () => {
    setTempName(projectName);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-xl font-bold text-gray-800">Project:</h1>
      {editing ? (
        <>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="text-xl font-medium bg-transparent border-b border-indigo-500 focus:outline-none px-1"
            autoFocus
          />
          <button
            onClick={saveName}
            className="p-1 rounded hover:bg-green-100 text-green-600"
            title="Save"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 rounded hover:bg-red-100 text-red-600"
            title="Cancel"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-light">{projectName}</h2>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            title="Edit project name"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

// ---------------- Main App ----------------
function App() {
  const [projectName, setProjectName] = useState(() => {
    if (typeof window !== "undefined") {
      const storedName = window.localStorage.getItem(PROJECT_NAME_STORAGE_KEY);
      if (storedName) {
        return storedName;
      }
    }
    return DEFAULT_PROJECT_NAME;
  });
  const [activeTab, setActiveTab] = useState("Workload");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (projectName === DEFAULT_PROJECT_NAME) {
      window.localStorage.removeItem(PROJECT_NAME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PROJECT_NAME_STORAGE_KEY, projectName);
    }
  }, [projectName]);

  const updateProjectName = (name) => {
    const nextName = name.trim();
    setProjectName(nextName || DEFAULT_PROJECT_NAME);
  };

  const resetProjectName = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROJECT_NAME_STORAGE_KEY);
    }
    setProjectName(DEFAULT_PROJECT_NAME);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* NAVBAR 1 - Top Dark Bar */}
      <header className="bg-[#22272e] text-white px-8 py-3.5 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">NKP Sizer</h1>
        <nav className="flex gap-8 text-base font-light">
          <a href="#" className="hover:text-gray-300">Dashboard</a>
          <a href="#" className="hover:text-gray-300">Projects</a>
          <a href="#" className="hover:text-gray-300">Help</a>
        </nav>
      </header>

      {/* NAVBAR 2 - Project Name & Actions */}
      <div className="bg-white border-b px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
        <ProjectName projectName={projectName} onUpdateProjectName={updateProjectName} />
        <div className="flex gap-3 mt-2 md:mt-0">
          {/* BOM Dropdown */}
          <Menu as="div" className="relative inline-block">
            <MenuButton className="inline-flex justify-center gap-x-1.5 rounded-none border px-6 py-1 text-sm font-light text-black hover:bg-gray-100">
              BOM
              <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right bg-gray-800 shadow-lg focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-700 text-white" : "text-gray-300"
                      }`}
                    >
                      Download
                    </a>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>

          {/* More Dropdown */}
          <Menu as="div" className="relative inline-block">
            <MenuButton className="inline-flex justify-center gap-x-1.5 rounded-none border px-6 py-1 text-sm font-light text-black hover:bg-gray-100">
              More
              <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right bg-gray-800 shadow-lg focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-700 text-white" : "text-gray-300"
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

      {/* NAVBAR 3 - Workload & Solution Tabs */}
      <div className="bg-white border-b px-8 py-2 flex items-center gap-6 text-sm font-light">
        <button
          onClick={() => setActiveTab("Workload")}
          className={`pb-2 ${
            activeTab === "Workload"
              ? "text-black border-b-2 border-sky-600 font-medium"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Workloads
        </button>
        <button
          onClick={() => setActiveTab("Solution")}
          className={`pb-2 ${
            activeTab === "Solution"
              ? "text-black border-b-2 border-sky-600 font-medium"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Solution
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-6 py-6">
        {activeTab === "Workload" ? (
          <WorkloadPage onResetProjectName={resetProjectName} />
        ) : (
          <SolutionPage onResetProjectName={resetProjectName} />
        )}
      </main>
      <footer className="bg-[#22272e] text-gray-300 text-xs text-center py-3">
        © 2025 Nattavee Narischat. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
