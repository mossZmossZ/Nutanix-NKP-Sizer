import { useState } from "react"
import Swal from "sweetalert2"
import { Settings } from "lucide-react"

export default function SolutionPage() {
  const [license, setLicense] = useState("Start")
  const [hardwareData, setHardwareData] = useState([
    {
      id: 1,
      cluster: "Cluster-01",
      model: "Dell PowerEdge R750",
      quantity: 3,
      cores: 64,
      ram: 512,
      data: 10.5,
    },
    {
      id: 2,
      cluster: "Cluster-02",
      model: "HPE ProLiant DL380",
      quantity: 2,
      cores: 48,
      ram: 256,
      data: 8.0,
    },
  ])

  // Mock data for sizing summary
  const sizingData = {
    workload: { usage: 65, name: "Web Apps" },
    pod: { usage: 45, name: "Containers" },
    cpu: { usage: 78, name: "Processing" },
    ram: { usage: 82, name: "Memory" },
    data: { usage: 35, name: "Storage" },
  }

  const openLicenseModal = async () => {
    const { value: selectedLicense } = await Swal.fire({
      title: "Modify License",
      input: "select",
      inputOptions: {
        Start: "Start",
        Pro: "Pro",
        Ultimate: "Ultimate",
      },
      inputValue: license,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3b82f6",
      backdrop: false,
      allowOutsideClick: false,
    })

    if (selectedLicense) {
      setLicense(selectedLicense)
      await Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `License changed to ${selectedLicense}`,
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
      })
    }
  }

  const openHardwareModal = async () => {
    await Swal.fire({
      title: "Hardware Configuration",
      text: "Hardware modification panel would open here",
      icon: "info",
      confirmButtonColor: "#3b82f6",
      backdrop: false,
      allowOutsideClick: false,
    })
  }

  const CircularGauge = ({ data, label }) => {
    const isHealthy = data.usage <= 80
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (data.usage / 100) * circumference

    return (
      <div className="flex flex-col items-center p-4">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-300 ${isHealthy ? "text-green-500" : "text-red-500"}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${isHealthy ? "bg-green-500" : "bg-red-500"}`}></div>
              <div className="text-sm font-semibold">{data.usage}%</div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium text-sm">{data.name}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Box 1: License */}
      <div className="bg-white shadow rounded-lg">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">License</h2>
          <div className="flex items-center space-x-2">
            <button onClick={openLicenseModal} className="p-1.5 text-gray-500 hover:text-gray-700 transition">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={openLicenseModal}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Modify
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-600">
            Show License: <span className="font-semibold text-gray-800">"{license}"</span>
          </div>
        </div>
      </div>

      {/* Box 2: Sizing Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Sizing Summary</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <CircularGauge data={sizingData.workload} label="Workload" />
            <CircularGauge data={sizingData.pod} label="POD" />
            <CircularGauge data={sizingData.cpu} label="CPU" />
            <CircularGauge data={sizingData.ram} label="RAM" />
            <CircularGauge data={sizingData.data} label="DATA" />
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Bad</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Box 3: Hardware Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Hardware Summary</h2>
          <div className="flex items-center space-x-2">
            <button onClick={openHardwareModal} className="p-1.5 text-gray-500 hover:text-gray-700 transition">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={openHardwareModal}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Modify
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border text-sm rounded-md overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 border text-left">Cluster/Model</th>
                  <th className="px-3 py-2 border text-right">Quantity</th>
                  <th className="px-3 py-2 border text-right">Cores</th>
                  <th className="px-3 py-2 border text-right">RAM (GB)</th>
                  <th className="px-3 py-2 border text-right">DATA (TB)</th>
                </tr>
              </thead>
              <tbody>
                {hardwareData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">
                      <div>
                        <div className="font-medium">{item.cluster}</div>
                        <div className="text-xs text-gray-500">{item.model}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 border text-right">{item.quantity}</td>
                    <td className="px-3 py-2 border text-right">{item.cores}</td>
                    <td className="px-3 py-2 border text-right">{item.ram}</td>
                    <td className="px-3 py-2 border text-right">{item.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
