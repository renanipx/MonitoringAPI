import { useState } from "react";
import { deleteMonitor } from "../services/api";

export function useMonitorActions(onSuccess: () => void) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<any>(null);
  const [monitorToDelete, setMonitorToDelete] = useState<any>(null);
  const [keepIncidentsOnDelete, setKeepIncidentsOnDelete] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!monitorToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMonitor(monitorToDelete.id, keepIncidentsOnDelete);
      setMonitorToDelete(null);
      onSuccess();
    } catch (err) {
      console.error("Failed to delete monitor:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAdd = () => {
    setEditingMonitor(null);
    setShowAddModal(true);
  };

  const openEdit = (monitor: any) => {
    setEditingMonitor(monitor);
    setShowAddModal(true);
  };

  const closeAdd = () => setShowAddModal(false);
  const closeDelete = () => setMonitorToDelete(null);

  return {
    showAddModal,
    editingMonitor,
    monitorToDelete,
    keepIncidentsOnDelete,
    isDeleting,
    setMonitorToDelete,
    setKeepIncidentsOnDelete,
    handleDelete,
    openAdd,
    openEdit,
    closeAdd,
    closeDelete
  };
}
