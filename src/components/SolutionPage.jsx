import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { Settings, TrendingUp } from "lucide-react"

const CLUSTERS = ["NKP Management","Production", "DR", "DEV", "UAT", "SIT"]
const WORKLOAD_CLUSTER_MAPPING = {
  "NKP Management": "nkp_management",
  Production: "production_cluster",
  DR: "dr_cluster",
  DEV: "development_(dev)",
  UAT: "development_(uat)",
  SIT: "development_(sit)"
}

// Replace the existing DEFAULT_GROWTH_RATES definition with this dynamic version:
const DEFAULT_GROWTH_RATES = Array.from({ length: 5 }, (_, i) => ({
  year: new Date().getFullYear() + i + 1,
  rate: (i + 1) * 20,
}))

export default function SolutionPage({ onResetProjectName = () => {} }) {
  const [license, setLicense] = useState("Starter")
  const [selectedCluster, setSelectedCluster] = useState("Production")
  const [hardwareData, setHardwareData] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [selectedGrowthMetric, setSelectedGrowthMetric] = useState("vCPU")  // was "vcpu"
  const [animateGauges, setAnimateGauges] = useState(false)

  const [hardwareForm, setHardwareForm] = useState({
    name: "",
    cluster: "Production",
    // Control Plane fields
    cpNodeQty: 3,
    cpVcpus: 4,
    cpMem: 16,
    cpDisk: 80,
    // Worker Node fields
    workerNodeQty: 4,
    workerVcpus: 8,
    workerMem: 32,
    workerDisk: 100,
    // Reserved resources
    reservedVcpus: 12,
    reservedMem: 15,
  })

  useEffect(() => {
    // Load hardware data
    const savedHardware = localStorage.getItem("hardwareData")
    let initialHardware = []
    if (savedHardware) {
      try {
        initialHardware = JSON.parse(savedHardware)
      } catch {
        initialHardware = []
      }
    }
    // Add initial NKP Management Cluster if not already present
    if (!initialHardware.some(item => item.cluster === "NKP Management")) {
      initialHardware.push({
        id: Date.now(),
        name: "NKP Management Cluster",
        cluster: "NKP Management",
        cpNodeQty: 3,         // Minimum 3 control plane nodes
        cpVcpus: 4,
        cpMem: 16,
        cpDisk: 80,
        workerNodeQty: 4,     // Initial worker nodes (min 2 required)
        workerVcpus: 8,
        workerMem: 32,
        workerDisk: 80,       // DATA 80 GiB
        reservedVcpus: 0,
        reservedMem: 0,
      });
      saveHardwareData(initialHardware)
    } else {
      setHardwareData(initialHardware)
    }
    
    // Load license data
    const savedLicense = localStorage.getItem("licenseData")
    if (savedLicense) {
      try {
        setLicense(JSON.parse(savedLicense))
      } catch {
        setLicense("Starter")
      }
    }

    // Load growth data - updated to use default growth rates
    const savedGrowth = localStorage.getItem("growthData")
    if (savedGrowth) {
      try {
        setGrowthData(JSON.parse(savedGrowth))
      } catch {
        setGrowthData(DEFAULT_GROWTH_RATES)
      }
    } else {
      setGrowthData(DEFAULT_GROWTH_RATES)
      saveGrowthData(DEFAULT_GROWTH_RATES)
    }

    // Trigger gauge animation on load
    setTimeout(() => setAnimateGauges(true), 500)
  }, [])

  const saveHardwareData = (data) => {
    localStorage.setItem("hardwareData", JSON.stringify(data))
    setHardwareData(data)
  }

  const saveLicenseData = (licenseType) => {
    localStorage.setItem("licenseData", JSON.stringify(licenseType))
    setLicense(licenseType)
  }

  const saveGrowthData = (data) => {
    localStorage.setItem("growthData", JSON.stringify(data))
    setGrowthData(data)
  }

  const getWorkloadData = (cluster) => {
    const mappedCluster = WORKLOAD_CLUSTER_MAPPING[cluster]
    if (!mappedCluster) return { pods: 0, cpu: 0, memory: 0, data: 0 }

    const cacheKey = `workloads_${mappedCluster}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const workloads = JSON.parse(cached)
        return workloads.reduce(
          (acc, workload) => ({
            pods: acc.pods + (workload.replica || 0),
            cpu: acc.cpu + (workload.cpu || 0),
            memory: acc.memory + (Number(workload.memory) || 0),
            data: acc.data + (Number(workload.data) || 0),
          }),
          { pods: 0, cpu: 0, memory: 0, data: 0 },
        )
      } catch {
        return { pods: 0, cpu: 0, memory: 0, data: 0 }
      }
    }
    return { pods: 0, cpu: 0, memory: 0, data: 0 }
  }

  const getClusterWorkloadCount = (cluster) => {
    const mappedCluster = WORKLOAD_CLUSTER_MAPPING[cluster]
    if (!mappedCluster) return 0

    const cacheKey = `workloads_${mappedCluster}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached).length
      } catch {
        return 0
      }
    }
    return 0
  }

  const getLicenseCores = () => {
    return hardwareData.reduce((total, item) => {
      return total + item.workerNodeQty * item.workerVcpus
    }, 0)
  }

  const getHardwareTotals = () => {
    const clusterHardware = hardwareData.filter((item) => item.cluster === selectedCluster)

    const totals = clusterHardware.reduce(
      (acc, item) => {
        const totalVcpus = item.cpNodeQty * item.cpVcpus + item.workerNodeQty * item.workerVcpus + item.reservedVcpus
        const totalMem = item.cpNodeQty * item.cpMem + item.workerNodeQty * item.workerMem + item.reservedMem
        const totalDisk = item.cpNodeQty * item.cpDisk + item.workerNodeQty * item.workerDisk

        acc.vcpus += totalVcpus
        acc.memory += totalMem
        acc.disk += totalDisk
        return acc
      },
      { vcpus: 0, memory: 0, disk: 0 },
    )

    return totals
  }

  const getSizingSummary = () => {
    const workloadData = getWorkloadData(selectedCluster)
    const hardwareTotals = getHardwareTotals()

    // Calculate usage percentages
    const podUsage =
      hardwareTotals.vcpus > 0 ? Math.min((workloadData.pods / (hardwareTotals.vcpus * 10)) * 100, 100) : 0
    const cpuUsage = hardwareTotals.vcpus > 0 ? Math.min((workloadData.cpu / hardwareTotals.vcpus) * 100, 100) : 0
    const memUsage = hardwareTotals.memory > 0 ? Math.min((workloadData.memory / hardwareTotals.memory) * 100, 100) : 0
    const dataUsage =
      hardwareTotals.disk > 0 ? Math.min((workloadData.data / hardwareTotals.disk) * 100, 100) : 0

    return {
      pod: { usage: Math.round(podUsage), name: "Containers", total: workloadData.pods },
      cpu: { usage: Math.round(cpuUsage), name: "Processing", used: workloadData.cpu, total: hardwareTotals.vcpus },
      ram: { usage: Math.round(memUsage), name: "Memory", used: workloadData.memory, total: hardwareTotals.memory },
      data: { usage: Math.round(dataUsage), name: "Storage (GiB)", used: workloadData.data, total: hardwareTotals.disk },
    }
  }

  const getGrowthProjections = () => {
    const currentYear = new Date().getFullYear()
    const hardwareTotals = getHardwareTotals()
    const projections = []

    for (let i = 0; i <= 5; i++) {
      const year = currentYear + i
      let growthRate = 0

      // Find growth rate for this year
      const yearGrowth = growthData.find((g) => g.year === year)
      if (yearGrowth) {
        growthRate = yearGrowth.rate / 100
      }

      const multiplier = Math.pow(1 + growthRate, i)
      projections.push({
        year,
        vCPU: Math.round(hardwareTotals.vcpus * multiplier),    // changed key from vcpu
        Memory: Math.round(hardwareTotals.memory * multiplier),   // changed key from memory
        Disk: Math.round(hardwareTotals.disk * multiplier),       // changed key from data
      })
    }

    return projections
  }

  const resetWizard = async () => {
    const result = await Swal.fire({
      title: "Reset Wizard",
      text: "This will clear all workloads, hardware, license, and growth data from all clusters. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset it!",
      cancelButtonText: "Cancel",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
    })

    if (result.isConfirmed) {
      // Clear all localStorage data
      localStorage.clear()

      // Re-add initial NKP Management configuration
      const initialNKP = {
        id: Date.now(),
        name: "NKP Management Cluster",
        cluster: "NKP Management",
        cpNodeQty: 3,         // Minimum 3 control plane nodes
        cpVcpus: 4,
        cpMem: 16,
        cpDisk: 80,
        workerNodeQty: 4,     // Initial worker nodes (min 2 required)
        workerVcpus: 8,
        workerMem: 32,
        workerDisk: 80,       // DATA 80 GiB
        reservedVcpus: 0,
        reservedMem: 0,
      }
      saveHardwareData([initialNKP])
      saveGrowthData(DEFAULT_GROWTH_RATES)
      saveLicenseData("Starter")
      // Unaffected clusters will be re-added later when needed

      onResetProjectName();

      await Swal.fire({
        icon: "success",
        title: "Reset Complete!",
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  const openLicenseModal = async () => {
    const { value: selectedLicense } = await Swal.fire({
      title: "Modify License",
      input: "select",
      inputOptions: {
        Starter: "Starter",
        Pro: "Pro",
        Ultimate: "Ultimate",
      },
      inputValue: license,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7c3aed",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
    })

    if (selectedLicense) {
      saveLicenseData(selectedLicense)
      await Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `License changed to ${selectedLicense}`,
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  const openHardwareModal = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Add Hardware Configuration",
      html: `
        <div class="space-y-4 text-left max-h-96 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
            <input id="swal-input1" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="Configuration name" value="${hardwareForm.name}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deploy To Cluster</label>
            <select id="swal-input2" class="w-full p-2 border border-gray-300 rounded-lg">
              ${CLUSTERS.map((cluster) => `<option value="${cluster}" ${cluster === hardwareForm.cluster ? "selected" : ""}>${cluster}</option>`).join("")}
            </select>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-semibold text-gray-800 mb-3">Control Plane Configuration</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Node Qty (Min 3 for Prod/DR)</label>
                <input id="swal-input3" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.cpNodeQty}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">vCPUs</label>
                <input id="swal-input4" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.cpVcpus}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Memory (GB)</label>
                <input id="swal-input5" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.cpMem}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Disk (GiB)</label>
                <input id="swal-input6" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.cpDisk}">
              </div>
            </div>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-semibold text-gray-800 mb-3">Worker Node Configuration</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Node Qty</label>
                <input id="swal-input7" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.workerNodeQty}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">vCPUs</label>
                <input id="swal-input8" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.workerVcpus}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Memory (GB)</label>
                <input id="swal-input9" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.workerMem}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Disk (GiB)</label>
                <input id="swal-input10" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="1" value="${hardwareForm.workerDisk}">
              </div>
            </div>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-semibold text-gray-800 mb-3">Reserved Resources</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reserved vCPUs</label>
                <input id="swal-input11" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="0" value="${hardwareForm.reservedVcpus}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reserved Memory (GB)</label>
                <input id="swal-input12" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="0" value="${hardwareForm.reservedMem}">
              </div>
            </div>
          </div>
        </div>
      `,
      width: "60%",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7c3aed",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
      preConfirm: () => {
        const cluster = document.getElementById("swal-input2").value
        const cpNodeQty = Number.parseInt(document.getElementById("swal-input3").value)

        // Validation: minimum 3 control plane nodes for Production and DR
        if ((cluster === "Production" || cluster === "DR") && cpNodeQty < 3) {
          Swal.showValidationMessage("Production and DR clusters require minimum 3 control plane nodes")
          return false
        }

        // Validation: no negative values
        const values = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) =>
          Number.parseInt(document.getElementById(`swal-input${i}`).value),
        )

        if (values.some((val) => val < 0)) {
          Swal.showValidationMessage("All values must be positive numbers")
          return false
        }

        return {
          name: document.getElementById("swal-input1").value,
          cluster: cluster,
          cpNodeQty: cpNodeQty,
          cpVcpus: values[1],
          cpMem: values[2],
          cpDisk: values[3],
          workerNodeQty: values[4],
          workerVcpus: values[5],
          workerMem: values[6],
          workerDisk: values[7],
          reservedVcpus: values[8],
          reservedMem: values[9],
        }
      },
    })

    if (formValues && formValues.name) {
      const newHardware = {
        id: Date.now(),
        ...formValues,
      }

      const updatedData = [...hardwareData, newHardware]
      saveHardwareData(updatedData)

      await Swal.fire({
        icon: "success",
        title: "Added!",
        text: "Hardware configuration has been added successfully.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  const openGrowthModal = async () => {
    const currentYear = new Date().getFullYear()
    const availableYears = []

    // Generate next 10 years, excluding years that already have growth data
    for (let i = 1; i <= 10; i++) {
      const year = currentYear + i
      if (!growthData.find((g) => g.year === year)) {
        availableYears.push(year)
      }
    }

    if (availableYears.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "No Available Years",
        text: "All years up to 10 years ahead already have growth rates defined.",
        backdrop: `rgba(0,0,0,0.4)`,
      })
      return
    }

    const { value: formValues } = await Swal.fire({
      title: "Add Growth Rate",
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select id="growth-year" class="w-full p-2 border border-gray-300 rounded-lg">
              ${availableYears.map((year) => `<option value="${year}">${year}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Growth Rate (%)</label>
            <input id="growth-rate" type="number" class="w-full p-2 border border-gray-300 rounded-lg" min="0" max="100" step="0.1" placeholder="e.g., 15.5">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7c3aed",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
      preConfirm: () => {
        const year = Number.parseInt(document.getElementById("growth-year").value)
        const rate = Number.parseFloat(document.getElementById("growth-rate").value)

        if (!rate || rate < 0) {
          Swal.showValidationMessage("Please enter a valid growth rate")
          return false
        }

        return { year, rate }
      },
    })

    if (formValues) {
      const updatedGrowth = [...growthData, formValues].sort((a, b) => a.year - b.year)
      saveGrowthData(updatedGrowth)

      await Swal.fire({
        icon: "success",
        title: "Added!",
        text: `Growth rate for ${formValues.year} has been added.`,
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  // Delete hardware
  const deleteHardware = async (id) => {
    const hardware = hardwareData.find((item) => item.id === id)

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${hardware?.name}"? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
    })

    if (result.isConfirmed) {
      const updatedData = hardwareData.filter((item) => item.id !== id)
      saveHardwareData(updatedData)

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Hardware configuration has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  const deleteGrowthRate = async (year) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete growth rate for ${year}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
    })

    if (result.isConfirmed) {
      const updatedGrowth = growthData.filter((g) => g.year !== year)
      saveGrowthData(updatedGrowth)

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Growth rate has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
      })
    }
  }

  const CircularGauge = ({ data, label, cluster }) => {
    // Gauge color logic: green <=60, yellow >60-80, red >80
    let colorClass = "text-green-500"
    let dotClass = "bg-green-500"
    if (data.usage > 80) {
      colorClass = "text-red-500"
      dotClass = "bg-red-500"
    } else if (data.usage > 60) {
      colorClass = "text-yellow-400"
      dotClass = "bg-yellow-400"
    }
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = animateGauges ? circumference - (data.usage / 100) * circumference : circumference

    let centerValue;
    if (label === "POD") {
      centerValue = data.total;
    } else {
      // For NKP Management, hide the "0/" when used is 0; otherwise, show used/total.
      centerValue = (cluster === "NKP Management" && data.used === 0)
        ? data.total
        : `${data.used}/${data.total}`;
    }

    return (
      <div className="flex flex-col items-center p-4 group cursor-pointer">
        <div className="relative w-24 h-24 mb-2 transform transition-transform duration-300 group-hover:scale-110">
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
              className={`transition-all duration-2000 ease-out ${colorClass}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${dotClass}`}></div>
              <div className="text-sm font-semibold">{centerValue}</div>
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

  const GrowthLineChart = () => {
    const projections = getGrowthProjections()
    const maxValue = Math.max(...projections.map((p) => p[selectedGrowthMetric]))
    const minValue = Math.min(...projections.map((p) => p[selectedGrowthMetric]))
    const range = maxValue - minValue

    // Generate SVG path for line chart
    const generatePath = () => {
      if (projections.length === 0) return ""

      const width = 400
      const height = 150
      const padding = 20

      const points = projections.map((proj, index) => {
        const x = padding + (index / (projections.length - 1)) * (width - 2 * padding)
        const y =
          range > 0
            ? height - padding - ((proj[selectedGrowthMetric] - minValue) / range) * (height - 2 * padding)
            : height / 2
        return `${x},${y}`
      })

      return `M ${points.join(" L ")}`
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          {["vCPU", "Memory", "Disk"].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedGrowthMetric(metric)}
              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                selectedGrowthMetric === metric
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Line Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border">
          <svg width="100%" height="180" viewBox="0 0 400 180" className="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-fade-in"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Data points */}
            {projections.map((proj, index) => {
              const x = 20 + (index / (projections.length - 1)) * 360
              const y = range > 0 ? 160 - ((proj[selectedGrowthMetric] - minValue) / range) * 120 : 90
              return (
                <g key={proj.year}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#8b5cf6"
                    className="hover:r-6 transition-all duration-200 cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                  <text x={x} y={y - 10} textAnchor="middle" className="text-xs font-medium fill-gray-600">
                    {proj[selectedGrowthMetric]}
                  </text>
                  <text x={x} y="175" textAnchor="middle" className="text-xs fill-gray-500">
                    {proj.year}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    )
  }

  const GrowthRateBoxes = () => {
    const currentYear = new Date().getFullYear()
    const years = [1, 2, 3, 4, 5]
    const projections = getGrowthProjections()

    const updateGrowthRate = async (yearOffset, currentRate) => {
      const targetYear = currentYear + yearOffset

      const { value: newRate } = await Swal.fire({
        title: `Update Growth Rate for ${targetYear}`,
        input: "number",
        inputLabel: "Growth Rate (%)",
        inputValue: currentRate || 0,
        inputAttributes: {
          min: 0,
          max: 100,
          step: 0.1,
        },
        showCancelButton: true,
        confirmButtonText: "Update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#7c3aed",
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false,
        inputValidator: (value) => {
          if (value === "" || isNaN(parseFloat(value)) || parseFloat(value) < 0) {
            return "Please enter a valid growth rate"
          }
        },
      })

      if (newRate !== undefined) {
        const existingIndex = growthData.findIndex((g) => g.year === targetYear)
        let updatedGrowth

        if (existingIndex >= 0) {
          updatedGrowth = [...growthData]
          updatedGrowth[existingIndex] = { year: targetYear, rate: Number.parseFloat(newRate) }
        } else {
          updatedGrowth = [...growthData, { year: targetYear, rate: Number.parseFloat(newRate) }]
        }

        saveGrowthData(updatedGrowth.sort((a, b) => a.year - b.year))

        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: `Growth rate for ${targetYear} has been updated.`,
          timer: 1500,
          showConfirmButton: false,
          backdrop: `rgba(0,0,0,0.4)`,
          allowOutsideClick: false,
        })
      }
    }

    return (
      <div className="grid grid-cols-5 gap-3 mt-4">
        {years.map((yearOffset) => {
          const targetYear = currentYear + yearOffset
          const growthRate = growthData.find((g) => g.year === targetYear)?.rate || 0
          const projection = projections[yearOffset]

          return (
            <div
              key={yearOffset}
              className="bg-white border-2 border-purple-200 rounded-lg p-3 hover:border-purple-400 transition-all duration-200 hover:scale-105 cursor-pointer group"
              onClick={() => updateGrowthRate(yearOffset, growthRate)}
            >
              <div className="text-center space-y-2">
                <div className="text-sm font-semibold text-purple-700">Year {yearOffset}</div>
                <div className="text-xs text-gray-500">{targetYear}</div>

                <div className="bg-purple-50 rounded p-2 group-hover:bg-purple-100 transition-colors duration-200">
                  <div className="text-xs text-gray-600 mb-1">Growth Rate</div>
                  <div className="text-lg font-bold text-purple-600">{growthRate}%</div>
                </div>

                {projection && (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">vCPU:</span>
                      <span className="font-medium">{projection.vCPU}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Memory:</span>
                      <span className="font-medium">{projection.Memory}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Disk:</span>
                      <span className="font-medium">{projection.Disk}GiB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const hardwareTotals = getHardwareTotals()
  const sizingData = getSizingSummary()
  const licenseCores = getLicenseCores()
  const projections = getGrowthProjections()
  const fiveYearGrowth = projections[5] || projections[projections.length - 1]

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Box 1: License */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-center border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-800">License</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={openLicenseModal}
              className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors duration-200 hover:scale-110 transform"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={openLicenseModal}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            >
              Modify
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm text-gray-600">
            License: <span className="font-semibold text-gray-900">"{license}"</span>
          </div>
          <div className="text-sm text-gray-600">
            License Cores: <span className="font-semibold text-purple-600">{licenseCores} cores</span>
          </div>
        </div>
      </div>

      {/* Box 2: Sizing Summary */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-800">Sizing Summary</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <CircularGauge data={sizingData.pod} label="POD" cluster={selectedCluster} />
            <CircularGauge data={sizingData.cpu} label="CPU" cluster={selectedCluster} />
            <CircularGauge data={sizingData.ram} label="RAM" cluster={selectedCluster} />
            <CircularGauge data={sizingData.data} label="Disk (GiB)" cluster={selectedCluster} />
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Over Capacity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-600">Warning Capacity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Good Capacity</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Select Cluster</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {CLUSTERS.map((cluster) => (
                <button
                  key={cluster}
                  onClick={() => setSelectedCluster(cluster)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    selectedCluster === cluster
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cluster === "NKP Management" ? cluster : `${cluster}(${getClusterWorkloadCount(cluster)})`}
                </button>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600">Selected: </span>
              <span className="text-sm font-semibold text-purple-600">{selectedCluster}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Totals Box */}
      <div className="bg-purple-50 shadow-lg rounded-lg border-2 border-purple-200 hover:shadow-xl transition-shadow duration-300">
        <div className="border-b border-purple-200 px-4 py-3">
          <h2 className="text-sm font-medium text-purple-800">Hardware Totals - {selectedCluster} Cluster</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{hardwareTotals.vcpus}</div>
                <div className="text-sm text-gray-600">Total vCPUs</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{hardwareTotals.memory}</div>
                <div className="text-sm text-gray-600">Total Memory (GB)</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{hardwareTotals.disk}</div>
                <div className="text-sm text-gray-600">Total Disk (GiB)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box 3: Hardware Summary */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-center border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-800">Hardware Summary</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={openHardwareModal}
              className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors duration-200 hover:scale-110 transform"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={openHardwareModal}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            >
              Add Hardware
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border text-sm rounded-md overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 border text-left">Name/Cluster</th>
                  <th className="px-3 py-2 border text-center">Control Plane</th>
                  <th className="px-3 py-2 border text-center">Worker Nodes</th>
                  <th className="px-3 py-2 border text-center">Reserved</th>
                  <th className="px-3 py-2 border text-right">Total vCPUs</th>
                  <th className="px-3 py-2 border text-right">Total Memory (GB)</th>
                  <th className="px-3 py-2 border text-right">Total Disk (GiB)</th>
                  <th className="px-3 py-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hardwareData
                  .filter((item) => item.cluster === selectedCluster)
                  .map((item) => {
                    const totalVcpus =
                      item.cpNodeQty * item.cpVcpus + item.workerNodeQty * item.workerVcpus + item.reservedVcpus
                    const totalMem =
                      item.cpNodeQty * item.cpMem + item.workerNodeQty * item.workerMem + item.reservedMem
                    const totalDisk = item.cpNodeQty * item.cpDisk + item.workerNodeQty * item.workerDisk

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-2 border">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.cluster}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <div className="text-xs">
                            <div>
                              {item.cpNodeQty}x {item.cpVcpus}vCPU
                            </div>
                            <div>
                              {item.cpMem}GB, {item.cpDisk}GiB
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <div className="text-xs">
                            <div>
                              {item.workerNodeQty}x {item.workerVcpus}vCPU
                            </div>
                            <div>
                              {item.workerMem}GB, {item.workerDisk}GiB
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <div className="text-xs">
                            <div>{item.reservedVcpus}vCPU</div>
                            <div>{item.reservedMem}GB</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border text-right font-medium">{totalVcpus}</td>
                        <td className="px-3 py-2 border text-right font-medium">{totalMem}</td>
                        <td className="px-3 py-2 border text-right font-medium">{totalDisk}</td>
                        <td className="px-3 py-2 border text-center">
                          <button
                            onClick={() => deleteHardware(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 hover:scale-110 transform"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                {hardwareData.filter((item) => item.cluster === selectedCluster).length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-4 border">
                      No hardware configurations for {selectedCluster} cluster
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Growth Rate Projections Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg rounded-lg border-2 border-indigo-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        <div className="flex justify-between items-center border-b border-indigo-200 px-4 py-3">
          <h2 className="text-sm font-medium text-indigo-800 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Growth Rate</span>
          </h2>
          {/* Removed Add Growth Rate button */}
        </div>
        <div className="p-4">
          <GrowthLineChart />
          <GrowthRateBoxes />

          {/* Growth Summary */}
          {fiveYearGrowth && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors duration-200">
              <div className="text-sm font-medium text-indigo-700 mb-2">5-Year Growth Summary</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="hover:scale-105 transition-transform duration-200">
                  <div className="text-lg font-bold text-indigo-600">{fiveYearGrowth.vCPU}</div>
                  <div className="text-xs text-gray-600">vCPUs</div>
                </div>
                <div className="hover:scale-105 transition-transform duration-200">
                  <div className="text-lg font-bold text-indigo-600">{fiveYearGrowth.Memory}</div>
                  <div className="text-xs text-gray-600">Memory (GB)</div>
                </div>
                <div className="hover:scale-105 transition-transform duration-200">
                  <div className="text-lg font-bold text-indigo-600">{fiveYearGrowth.Disk}</div>
                  <div className="text-xs text-gray-600">Storage (GiB)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={resetWizard}
          className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors duration-200 underline hover:no-underline"
        >
          Reset Wizard
        </button>
      </div>
    </div>
  )
}

