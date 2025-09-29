import { useState, useEffect } from "react"
import Swal from "sweetalert2"

const CLUSTERS = ["Production Cluster", "DR Cluster", "Development (DEV)", "Development (UAT)", "Development (SIT)"]

export default function WorkloadPage({ onResetProjectName = () => {} }) {
  const [selectedCluster, setSelectedCluster] = useState("Production Cluster")
  const [workloads, setWorkloads] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingWorkload, setEditingWorkload] = useState(null)

  const [form, setForm] = useState({
    name: "",
    type: "Container",
    replica: 1,
    cpu: 1,
    memory: "",
    disk: "",
    deployTo: "Production Cluster",
  })

  useEffect(() => {
    const cacheKey = `workloads_${selectedCluster.replace(/\s+/g, "_").toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setWorkloads(JSON.parse(cached))
      } catch {
        setWorkloads([])
      }
    } else {
      setWorkloads([])
    }
  }, [selectedCluster])

  const getClusterCount = (cluster) => {
    const cacheKey = `workloads_${cluster.replace(/\s+/g, "_").toLowerCase()}`
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

  const totals = workloads.reduce(
    (acc, workload) => ({
      pods: acc.pods + (workload.replica || 0),
      cpu: acc.cpu + (workload.cpu || 0),
      memory: acc.memory + (Number(workload.memory) || 0),
      disk: acc.disk + (Number(workload.disk) || 0),
    }),
    { pods: 0, cpu: 0, memory: 0, disk: 0 },
  )

  const saveToStorage = (data, cluster = selectedCluster) => {
    const cacheKey = `workloads_${cluster.replace(/\s+/g, "_").toLowerCase()}`
    localStorage.setItem(cacheKey, JSON.stringify(data))
  }

  const handleResetWizard = async () => {
    const result = await Swal.fire({
      title: "Reset Wizard",
      text: "This will clear all workloads and reset the wizard. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset it!",
      cancelButtonText: "Cancel",
      backdrop: false,
      allowOutsideClick: false,
    })

    if (result.isConfirmed) {
      CLUSTERS.forEach((cluster) => {
        const key = `workloads_${cluster.replace(/\s+/g, "_").toLowerCase()}`
        localStorage.removeItem(key)
      })
      setWorkloads([])

      onResetProjectName();

      await Swal.fire({
        icon: "success",
        title: "Reset Complete!",
        text: "All workloads have been cleared and wizard has been reset.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
      })
    }
  }

  const openModal = (workload = null) => {
    if (workload) {
      setForm({ ...workload, deployTo: selectedCluster })
      setEditingWorkload(workload.id)
    } else {
      setForm({
        name: "",
        type: "Container",
        replica: 1,
        cpu: 1,
        memory: "",
        disk: "",
        deployTo: selectedCluster,
      })
      setEditingWorkload(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.memory || !form.disk) {
      setShowModal(false)
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields (Name, Memory, and Disk)",
        confirmButtonColor: "#3b82f6",
        backdrop: false,
        allowOutsideClick: false,
      })
      return
    }

    const targetCluster = form.deployTo

    if (editingWorkload) {
      if (targetCluster !== selectedCluster) {
        // Remove from current cluster
        const updatedCurrent = workloads.filter((w) => w.id !== editingWorkload)
        setWorkloads(updatedCurrent)
        saveToStorage(updatedCurrent, selectedCluster)

        // Add to target cluster
        const targetKey = `workloads_${targetCluster.replace(/\s+/g, "_").toLowerCase()}`
        const targetData = JSON.parse(localStorage.getItem(targetKey) || "[]")
        const updatedTarget = [...targetData, { ...form, id: editingWorkload }]
        saveToStorage(updatedTarget, targetCluster)
      } else {
        const updated = workloads.map((w) => (w.id === editingWorkload ? form : w))
        setWorkloads(updated)
        saveToStorage(updated)
      }

      setShowModal(false)
      await Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Workload has been updated and deployed to ${targetCluster}.`,
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
      })
    } else {
      const newWorkload = { ...form, id: Date.now() }

      if (targetCluster === selectedCluster) {
        const updated = [...workloads, newWorkload]
        setWorkloads(updated)
        saveToStorage(updated)
      } else {
        const targetKey = `workloads_${targetCluster.replace(/\s+/g, "_").toLowerCase()}`
        const targetData = JSON.parse(localStorage.getItem(targetKey) || "[]")
        const updatedTarget = [...targetData, newWorkload]
        saveToStorage(updatedTarget, targetCluster)
      }

      setShowModal(false)
      await Swal.fire({
        icon: "success",
        title: "Created!",
        text: `New workload has been deployed to ${targetCluster}.`,
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
      })
    }
  }

  const handleDelete = async (id) => {
    const workload = workloads.find((w) => w.id === id)

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${workload?.name}"? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      backdrop: false,
      allowOutsideClick: false,
    })

    if (result.isConfirmed) {
      const updated = workloads.filter((w) => w.id !== id)
      setWorkloads(updated)
      saveToStorage(updated)

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Workload has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
      })
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {CLUSTERS.map((cluster) => (
            <button
              key={cluster}
              onClick={() => setSelectedCluster(cluster)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCluster === cluster
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cluster}({getClusterCount(cluster)})
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-gray-600">Selected: </span>
          <span className="text-sm font-semibold text-blue-600">{selectedCluster}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600">Total PODs</div>
          <div className="text-2xl font-bold text-blue-800">{totals.pods}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600">Total CPU</div>
          <div className="text-2xl font-bold text-green-800">{totals.cpu} vCPU</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-600">Total Memory</div>
          <div className="text-2xl font-bold text-purple-800">{totals.memory} GiB</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-600">Total Disk</div>
          <div className="text-2xl font-bold text-orange-800">{totals.disk} GiB</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-sm font-medium text-gray-700">Total {workloads.length} Workloads</h2>
          <button
            type="button"
            onClick={() => openModal()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Workload
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-md overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 border text-left">Name</th>
                <th className="px-3 py-2 border text-left">Type</th>
                <th className="px-3 py-2 border text-right">Replica</th>
                <th className="px-3 py-2 border text-right">CPU (vCPU)</th>
                <th className="px-3 py-2 border text-right">Memory (GiB)</th>
                <th className="px-3 py-2 border text-right">Disk (GiB)</th>
                <th className="px-3 py-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {workloads.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{w.name}</td>
                  <td className="px-3 py-2 border">{w.type}</td>
                  <td className="px-3 py-2 border text-right">{w.replica}</td>
                  <td className="px-3 py-2 border text-right">{w.cpu}</td>
                  <td className="px-3 py-2 border text-right">{w.memory}</td>
                  <td className="px-3 py-2 border text-right">{w.disk}</td>
                  <td className="px-3 py-2 border text-center">
                    <button type="button" onClick={() => openModal(w)} className="text-blue-600 hover:underline mr-2">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(w.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {workloads.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-4 border">
                    No workloads added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleResetWizard}
          className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          Reset Wizard
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative transform transition-all scale-95 animate-fade-in border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingWorkload ? "Edit Workload" : "Add Workload"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <input
                  type="text"
                  placeholder="Workload name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Deploy To</label>
                <select
                  value={form.deployTo}
                  onChange={(e) => setForm({ ...form, deployTo: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {CLUSTERS.map((cluster) => (
                    <option key={cluster} value={cluster}>
                      {cluster}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Container</option>
                  <option>Server Virtualization</option>
                  <option>Database</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Replica</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Number of replicas"
                  value={form.replica}
                  onChange={(e) => setForm({ ...form, replica: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">CPU (vCPU)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="vCPU count"
                  value={form.cpu}
                  onChange={(e) => setForm({ ...form, cpu: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Memory (GiB)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Memory in GiB"
                  value={form.memory}
                  onChange={(e) => setForm({ ...form, memory: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Disk (GiB)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Disk in GiB"
                  value={form.disk}
                  onChange={(e) => setForm({ ...form, disk: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
