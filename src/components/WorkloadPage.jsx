import { useState } from "react"
import Swal from "sweetalert2"

export default function WorkloadPage() {
  const [workloads, setWorkloads] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingWorkload, setEditingWorkload] = useState(null)

  const [form, setForm] = useState({
    name: "",
    type: "Container",
    replica: 1,
    cpu: 1,
    memory: "",
    data: "",
  })

  const openModal = (workload = null) => {
    if (workload) {
      setForm(workload)
      setEditingWorkload(workload.id)
    } else {
      setForm({
        name: "",
        type: "Container",
        replica: 1,
        cpu: 1,
        memory: "",
        data: "",
      })
      setEditingWorkload(null)
    }
    setShowModal(true)
  }

    const handleSave = async () => {
    if (!form.name || !form.memory || !form.data) {
        setShowModal(false); // 👈 close modal first
        await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields (Name, Memory, and Data)",
        confirmButtonColor: "#3b82f6",
        backdrop: false,
        allowOutsideClick: false,
        })
        return
    }

    if (editingWorkload) {
        setWorkloads(workloads.map((w) => (w.id === editingWorkload ? form : w)))
        setShowModal(false) // 👈 close before showing Swal
        await Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Workload has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
        backdrop: false,
        allowOutsideClick: false,
        })
    } else {
        setWorkloads([...workloads, { ...form, id: Date.now() }])
        setShowModal(false) // 👈 close before showing Swal
        await Swal.fire({
        icon: "success",
        title: "Created!",
        text: "New workload has been added successfully.",
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
      setWorkloads(workloads.filter((w) => w.id !== id))

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
      <div className="bg-white shadow rounded-lg p-4">
        {/* Header */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-md overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 border text-left">Name</th>
                <th className="px-3 py-2 border text-left">Type</th>
                <th className="px-3 py-2 border text-right">Replica</th>
                <th className="px-3 py-2 border text-right">CPU (vCPU)</th>
                <th className="px-3 py-2 border text-right">Memory (GiB)</th>
                <th className="px-3 py-2 border text-right">Data (TiB)</th>
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
                  <td className="px-3 py-2 border text-right">{w.data}</td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative transform transition-all scale-95 animate-fade-in border"
            onClick={(e) => e.stopPropagation()} // prevent backdrop click from closing
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingWorkload ? "Edit Workload" : "Add Workload"}
            </h3>
            <div className="space-y-4">
              {/* Name */}
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
              {/* Type */}
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
              {/* Replica */}
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
              {/* CPU */}
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
              {/* Memory */}
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
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-600">Data (TiB)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Data in TiB"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Actions */}
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
