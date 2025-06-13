"use client";

import React, { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getEmptyImage } from "react-dnd-html5-backend";

export type Appointment = {
  id: string;
  massageType: string;
  phone: string;
  start: Date;
  end: Date;
  customer: string;
  status: "booked" | "checked-in" | "finished"; // ADD THIS LINE
};

let mockAppointments: Appointment[] = [
  {
    id: "1",
    massageType: "Swedish Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 10, 0),
    end: new Date(2025, 5, 12, 11, 30),
    customer: "Alice",
    status: "booked", // ADD THIS
  },
  {
    id: "2",
    massageType: "Deep Tissue Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 12, 0),
    end: new Date(2025, 5, 12, 14, 0),
    customer: "Bob",
    status: "checked-in", // ADD THIS
  },
  {
    id: "3",
    massageType: "Hot Stone Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 9, 30),
    end: new Date(2025, 5, 12, 10, 30),
    customer: "Carol",
    status: "finished", // ADD THIS
  },
];

const ContextMenu = ({
  isOpen,
  position,
  appointment,
  onClose,
  onStatusChange,
}: {
  isOpen: boolean;
  position: { x: number; y: number };
  appointment: Appointment | null;
  onClose: () => void;
  onStatusChange: (
    appointmentId: string,
    status: "booked" | "checked-in" | "finished"
  ) => void;
}) => {
  if (!isOpen || !appointment) return null;

  const handleStatusChange = (status: "booked" | "checked-in" | "finished") => {
    onStatusChange(appointment.id, status);
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
      style={{ left: position.x, top: position.y }}
    >
      {appointment.status !== "checked-in" && (
        <button
          onClick={() => handleStatusChange("checked-in")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
        >
          Check In
        </button>
      )}
      {appointment.status === "checked-in" && (
        <button
          onClick={() => handleStatusChange("finished")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
        >
          Check Out
        </button>
      )}
      {appointment.status !== "booked" && (
        <button
          onClick={() => handleStatusChange("booked")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
        >
          Mark as Booked
        </button>
      )}
    </div>
  );
};

const CurrentTimeLine = ({ currentDate }: { currentDate: Date }) => {
  const now = new Date();

  // Only show if it's the current date
  if (!isSameDay(now, currentDate)) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 9 * 60; // 9:00 AM
  const endMinutes = 22 * 60; // 10:00 PM

  // Only show during business hours
  if (currentMinutes < startMinutes || currentMinutes > endMinutes) return null;

  const offsetMinutes = currentMinutes - startMinutes;
  // Each 15-minute slot is 30px high, so 1 hour = 120px
  // Each minute = 120/60 = 2px
  const topPosition = offsetMinutes * 2;

  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
      style={{ top: `${topPosition + 49}px` }} // +64px to account for header height
    >
      <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
    </div>
  );
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function calculateDurationInHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function getAppointmentHeight(appointment: Appointment): number {
  const duration = calculateDurationInHours(appointment.start, appointment.end);
  // Each 15-minute slot is 20px, so 1 hour = 80px
  return Math.max(duration * 120, 20); // 80px per hour, minimum 20px
}

function getAppointmentTop(
  appointment: Appointment,
  timeSlot: { hour: number; minute: number }
): number {
  const appointmentMinutes =
    appointment.start.getHours() * 60 + appointment.start.getMinutes();
  const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
  const offsetMinutes = appointmentMinutes - slotMinutes;
  // Each minute is 80/60 = 1.333px (since 1 hour = 80px)
  return (offsetMinutes / 60) * 120;
}

const QuickAddModal = ({
  isOpen,
  onClose,
  onSave,
  workers,
  prefilledData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, "id">) => void;
  workers: string[];
  prefilledData: {
    worker: string;
    date: Date;
    timeSlot: { hour: number; minute: number };
  } | null;
}) => {
  const [form, setForm] = useState({
    massageType: "",
    customer: "",
    phone: "",
    date: "",
    start: "",
    end: "",
  });

  React.useEffect(() => {
    if (prefilledData) {
      const startTime = `${prefilledData.timeSlot.hour
        .toString()
        .padStart(2, "0")}:${prefilledData.timeSlot.minute
        .toString()
        .padStart(2, "0")}`;
      const endHour = prefilledData.timeSlot.hour + 1;
      const endTime = `${endHour
        .toString()
        .padStart(2, "0")}:${prefilledData.timeSlot.minute
        .toString()
        .padStart(2, "0")}`;

      setForm({
        massageType: "",
        customer: prefilledData.worker,
        phone: "",
        date: prefilledData.date.toISOString().slice(0, 10),
        start: startTime,
        end: endTime,
      });
    }
  }, [prefilledData]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (
      !form.massageType ||
      !form.customer ||
      !form.phone ||
      !form.date ||
      !form.start ||
      !form.end
    ) {
      alert("Please fill in all fields");
      return;
    }

    const startDate = new Date(`${form.date}T${form.start}`);
    const endDate = new Date(`${form.date}T${form.end}`);

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      phone: form.phone,
      massageType: form.massageType,
      customer: form.customer,
      start: startDate,
      end: endDate,
      status: "booked", // ADD THIS LINE
    };
    onSave(newAppointment);
    onClose();
  };

  if (!isOpen || !prefilledData) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end justify-end">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Quick Add Appointment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Massage Type
            </label>
            <input
              name="massageType"
              value={form.massageType}
              onChange={handleFormChange}
              placeholder="e.g., Swedish Massage"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker
            </label>
            <select
              name="customer"
              value={form.customer}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="123-456-7890"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="start"
                value={form.start}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="end"
                value={form.end}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

const AppointmentModal = ({
  appointment,
  isOpen,
  onClose,
  onSave,
  onDelete,
  workers,
}: {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAppointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  workers: string[];
}) => {
  const [editForm, setEditForm] = useState({
    massageType: "",
    customer: "",
    phone: "",
    date: "",
    start: "",
    end: "",
  });

  React.useEffect(() => {
    if (appointment) {
      setEditForm({
        massageType: appointment.massageType,
        customer: appointment.customer,
        phone: appointment.phone,
        date: appointment.start.toISOString().slice(0, 10),
        start: appointment.start.toTimeString().slice(0, 5),
        end: appointment.end.toTimeString().slice(0, 5),
      });
    }
  }, [appointment]);

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!appointment) return;

    if (
      !editForm.massageType ||
      !editForm.customer ||
      !editForm.phone ||
      !editForm.date ||
      !editForm.start ||
      !editForm.end
    ) {
      alert("Please fill in all fields");
      return;
    }

    const startDate = new Date(`${editForm.date}T${editForm.start}`);
    const endDate = new Date(`${editForm.date}T${editForm.end}`);

    const updatedAppointment: Appointment = {
      ...appointment,
      massageType: editForm.massageType,
      customer: editForm.customer,
      phone: editForm.phone,
      start: startDate,
      end: endDate,
    };

    onSave(updatedAppointment);
    onClose();
  };

  const handleDelete = () => {
    if (!appointment) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
      onDelete(appointment.id);
      onClose();
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end justify-end">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Appointment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Massage Type
            </label>
            <input
              name="massageType"
              value={editForm.massageType}
              onChange={handleEditFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker
            </label>
            <select
              name="customer"
              value={editForm.customer}
              onChange={handleEditFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={editForm.phone}
              onChange={handleEditFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={editForm.date}
              onChange={handleEditFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="start"
                value={editForm.start}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="end"
                value={editForm.end}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Replace the existing DraggableAppointment component with this updated version:
const DraggableAppointment = ({
  appointment,
  isFirst,
  timeSlot,
  onAppointmentClick,
  onContextMenu,
}: {
  appointment: Appointment;
  isFirst: boolean;
  timeSlot: { hour: number; minute: number };
  onAppointmentClick: (appointment: Appointment) => void;
  onContextMenu: (e: React.MouseEvent, appointment: Appointment) => void;
}) => {
  const [, dragRef, preview] = useDrag({
    type: "APPOINTMENT",
    item: { appointment },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);

  // Set drag preview offset to drag from the top of the appointment
  React.useEffect(() => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
      preview(divRef.current, {
        anchorX: 0.5, // Center horizontally
        anchorY: 0, // Top of the element
        offsetX: 35,
        offsetY: 10,
      });
    }
  }, [preview]);

  React.useEffect(() => {
    if (divRef.current && isFirst) {
      dragRef(divRef.current);
    }
  }, [dragRef, isFirst]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAppointmentClick(appointment);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, appointment);
  };

  if (!isFirst) {
    return null;
  }

  const height = getAppointmentHeight(appointment);
  const top = getAppointmentTop(appointment, timeSlot);

  // DETERMINE BACKGROUND COLOR BASED ON STATUS AND TIME
  const now = new Date();
  const isOverdue =
    appointment.status === "checked-in" && now > appointment.end;

  let bgColor = "bg-blue-100 hover:bg-blue-200"; // default booked
  let borderColor = "border-blue-500";

  if (appointment.status === "checked-in") {
    if (isOverdue) {
      bgColor = "bg-yellow-100 hover:bg-yellow-200";
      borderColor = "border-yellow-500";
    } else {
      bgColor = "bg-green-100 hover:bg-green-200";
      borderColor = "border-green-500";
    }
  } else if (appointment.status === "finished") {
    bgColor = "bg-gray-100 hover:bg-gray-200";
    borderColor = "border-gray-500";
  }

  return (
    <div
      ref={divRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`absolute ${bgColor} border-l-4 ${borderColor} p-2 rounded shadow text-sm cursor-pointer z-10 transition-colors`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: "4px",
        right: "4px",
        minHeight: "20px",
      }}
    >
      <div className="font-semibold text-xs">{appointment.massageType}</div>
      <div className="text-xs">
        {appointment.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        -
        {appointment.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="text-gray-600 text-xs">{appointment.customer}</div>
      <div className="text-xs font-medium capitalize">
        {appointment.status.replace("-", " ")}
      </div>
    </div>
  );
};

const DraggableWorkerHeader = ({
  worker,
  index,
  onReorderWorker,
}: {
  worker: string;
  index: number;
  onReorderWorker: (fromIndex: number, toIndex: number) => void;
}) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "WORKER",
    item: { worker, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: "WORKER",
    hover: (item: { worker: string; index: number }) => {
      if (item.index !== index) {
        onReorderWorker(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = React.useRef<HTMLTableHeaderCellElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      dragRef(ref.current);
      dropRef(ref.current);
    }
  }, [dragRef, dropRef]);

  return (
    <th
      ref={ref}
      className={`border-b bg-gray-50 p-3 text-center font-semibold text-gray-700 cursor-move select-none ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {worker}
    </th>
  );
};

const DroppableCell = ({
  date,
  timeSlot,
  worker,
  onDropAppointment,
  appointmentsForCell,
  onAppointmentClick,
  onCellClick,
  onContextMenu, // ADD THIS PROP
}: {
  date: Date;
  timeSlot: { hour: number; minute: number };
  worker: string;
  onDropAppointment: (
    appt: Appointment,
    newDate: Date,
    newTimeSlot: { hour: number; minute: number },
    newWorker: string
  ) => void;
  appointmentsForCell: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onCellClick: (
    worker: string,
    date: Date,
    timeSlot: { hour: number; minute: number }
  ) => void;
  onContextMenu: (e: React.MouseEvent, appointment: Appointment) => void; // ADD THIS
}) => {
  const [, dropRef] = useDrop({
    accept: "APPOINTMENT",
    drop: (item: { appointment: Appointment }) => {
      onDropAppointment(item.appointment, date, timeSlot, worker);
    },
  });

  const tdRef = React.useRef<HTMLTableDataCellElement>(null);

  React.useEffect(() => {
    if (tdRef.current) {
      dropRef(tdRef.current);
    }
  }, [dropRef]);

  const handleCellClick = (e: React.MouseEvent) => {
    if (appointmentsForCell.length === 0) {
      onCellClick(worker, date, timeSlot);
    }
  };

  return (
    <td
      ref={tdRef}
      className="border p-0 align-top relative cursor-pointer hover:bg-blue-50 transition-colors"
      style={{ height: "30px", minHeight: "30px" }} // Each 15-min slot = 20px
      onClick={handleCellClick}
    >
      {appointmentsForCell.map((appt, index) => {
        const appointmentStartMinutes =
          appt.start.getHours() * 60 + appt.start.getMinutes();
        const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
        const isFirst = appointmentStartMinutes === slotMinutes;

        return (
          <DraggableAppointment
            key={appt.id}
            appointment={appt}
            isFirst={isFirst}
            timeSlot={timeSlot}
            onAppointmentClick={onAppointmentClick}
            onContextMenu={onContextMenu} // ADD THIS
          />
        );
      })}
    </td>
  );
};

export default function DashboardPage() {
  // Add this to your DashboardPage component
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Force a re-render every minute to update the timeline
      setCurrentDate(new Date(currentDate.getTime())); // This triggers re-render
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    appointment: Appointment | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    appointment: null,
  });

  // Add these handlers to the main component:
  const handleContextMenu = (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      appointment,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      appointment: null,
    });
  };

  const handleStatusChange = (
    appointmentId: string,
    status: "booked" | "checked-in" | "finished"
  ) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status } : appt
      )
    );
  };

  // Add click outside handler
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        handleContextMenuClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.isOpen]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] =
    useState<Appointment[]>(mockAppointments);
  const [workers, setWorkers] = useState([
    "Alice",
    "Bob",
    "Carol",
    "Dave",
    "Eve",
  ]);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [quickAddData, setQuickAddData] = useState<{
    worker: string;
    date: Date;
    timeSlot: { hour: number; minute: number };
  } | null>(null);

  const [form, setForm] = useState({
    massageType: "",
    customer: "",
    phone: "",
    date: currentDate.toISOString().slice(0, 10),
    start: "09:00",
    end: "10:00",
  });

  // Generate time slots for every 15 minutes from 9:00 to 21:45
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAppointment = () => {
    if (
      !form.massageType ||
      !form.customer ||
      !form.phone ||
      !form.date ||
      !form.start ||
      !form.end
    ) {
      alert("Please fill in all fields");
      return;
    }

    const startDate = new Date(`${form.date}T${form.start}`);
    const endDate = new Date(`${form.date}T${form.end}`);
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      phone: form.phone,
      massageType: form.massageType,
      customer: form.customer,
      start: startDate,
      end: endDate,
      status: "booked", // ADD THIS LINE
    };
    setAppointments([...appointments, newAppointment]);
    setShowForm(false);
    setForm({
      massageType: "",
      customer: "",
      phone: "",
      date: currentDate.toISOString().slice(0, 10),
      start: "09:00",
      end: "10:00",
    });
  };

  const handleQuickAddSave = (appointmentData: Omit<Appointment, "id">) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      status: "booked", // ADD THIS LINE
    };
    setAppointments([...appointments, newAppointment]);
  };

  const handleDropAppointment = (
    appt: Appointment,
    newDate: Date,
    newTimeSlot: { hour: number; minute: number },
    newWorker: string
  ) => {
    const newStart = new Date(newDate);
    newStart.setHours(newTimeSlot.hour, newTimeSlot.minute, 0, 0);
    const duration = appt.end.getTime() - appt.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id
          ? {
              ...appt,
              start: newStart,
              end: newEnd,
              customer: newWorker,
            }
          : a
      )
    );
  };

  const handleReorderWorker = (fromIndex: number, toIndex: number) => {
    setWorkers((prev) => {
      const newWorkers = [...prev];
      const [moved] = newWorkers.splice(fromIndex, 1);
      newWorkers.splice(toIndex, 0, moved);
      return newWorkers;
    });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleCellClick = (
    worker: string,
    date: Date,
    timeSlot: { hour: number; minute: number }
  ) => {
    setQuickAddData({ worker, date, timeSlot });
    setShowQuickAdd(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  const handleQuickAddClose = () => {
    setShowQuickAdd(false);
    setQuickAddData(null);
  };

  const handleAppointmentSave = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );
  };

  const handleAppointmentDelete = (appointmentId: string) => {
    setAppointments((prev) => prev.filter((appt) => appt.id !== appointmentId));
  };

  const getAppointmentsForCell = (
    worker: string,
    timeSlot: { hour: number; minute: number }
  ) => {
    return appointments.filter((appt) => {
      if (appt.customer !== worker || !isSameDay(appt.start, currentDate)) {
        return false;
      }

      const appointmentStartMinutes =
        appt.start.getHours() * 60 + appt.start.getMinutes();
      const appointmentEndMinutes =
        appt.end.getHours() * 60 + appt.end.getMinutes();
      const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
      const slotEndMinutes = slotMinutes + 15;

      // Include appointment if it overlaps with this time slot
      return (
        appointmentStartMinutes < slotEndMinutes &&
        appointmentEndMinutes > slotMinutes
      );
    });
  };

  const shouldShowTimeLabel = (timeSlot: { hour: number; minute: number }) => {
    return timeSlot.minute === 0 || timeSlot.minute === 30;
  };

  const formatTimeSlot = (timeSlot: { hour: number; minute: number }) => {
    return `${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, "0")}`;
  };

  const Navbar = () => {
    return (
      <nav className="bg-blue-500 bg-opacity-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <img src="favicon.ico" alt="" className="w-8 h-8" />
                <h1 className="text-white text-xl font-bold">
                  Massage Scheduler
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Appointments
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Customers
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Orders
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Reports
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Navbar />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-green-500 text-white rounded mr-4"
          >
            Add Appointment
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setDate(currentDate.getDate() - 1))
              )
            }
            className="px-2 py-1 bg-gray-200 rounded"
          >
            &lt;
          </button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setDate(currentDate.getDate() + 1))
              )
            }
            className="px-2 py-1 bg-gray-200 rounded"
          >
            &gt;
          </button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 border rounded bg-gray-50 flex flex-wrap gap-2 items-end">
            <input
              name="massageType"
              value={form.massageType}
              onChange={handleFormChange}
              placeholder="Massage Type"
              className="border p-2 rounded"
            />
            <select
              name="customer"
              value={form.customer}
              onChange={handleFormChange}
              className="border p-2 rounded"
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="Phone"
              className="border p-2 rounded"
            />
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="border p-2 rounded"
            />
            <input
              type="time"
              name="start"
              value={form.start}
              onChange={handleFormChange}
              className="border p-2 rounded"
            />
            <input
              type="time"
              name="end"
              value={form.end}
              onChange={handleFormChange}
              className="border p-2 rounded"
            />
            <button
              onClick={handleAddAppointment}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Drag worker column headers to rearrange the
            order. Drag appointments to reschedule them to different workers or
            time slots. Click on appointments to edit or delete them. Click on
            empty cells to quickly add new appointments.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white relative">
          <CurrentTimeLine currentDate={currentDate} />
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b bg-gray-50 p-3 w-20 text-right font-semibold text-gray-700"></th>
                {workers.map((worker, index) => (
                  <DraggableWorkerHeader
                    key={worker}
                    worker={worker}
                    index={index}
                    onReorderWorker={handleReorderWorker}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, i) => {
                const isHour = timeSlot.minute === 45;
                // Apply isHour border to all cells in the row
                const borderClass = isHour
                  ? "border-b-2 border-gray-400"
                  : "border-b border-gray-200";
                return (
                  <tr
                    key={`${timeSlot.hour}-${timeSlot.minute}`}
                    className={i % 8 < 4 ? "bg-gray-50" : "bg-white"}
                  >
                    <td
                      className={`sticky left-0 z-10 bg-gray-50 p-1 text-right align-top font-mono text-gray-500 text-xs ${borderClass}`}
                    >
                      {shouldShowTimeLabel(timeSlot)
                        ? formatTimeSlot(timeSlot)
                        : ""}
                    </td>
                    {workers.map((worker) => {
                      const cellAppointments = getAppointmentsForCell(
                        worker,
                        timeSlot
                      );
                      return (
                        <DroppableCell
                          key={worker + timeSlot.hour + timeSlot.minute}
                          date={currentDate}
                          timeSlot={timeSlot}
                          worker={worker}
                          onDropAppointment={handleDropAppointment}
                          appointmentsForCell={cellAppointments}
                          onAppointmentClick={handleAppointmentClick}
                          onCellClick={handleCellClick}
                          onContextMenu={handleContextMenu} // ADD THIS LINE
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AppointmentModal
          appointment={selectedAppointment}
          isOpen={showModal}
          onClose={handleModalClose}
          onSave={handleAppointmentSave}
          onDelete={handleAppointmentDelete}
          workers={workers}
        />

        <QuickAddModal
          isOpen={showQuickAdd}
          onClose={handleQuickAddClose}
          onSave={handleQuickAddSave}
          workers={workers}
          prefilledData={quickAddData}
        />
      </div>
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        appointment={contextMenu.appointment}
        onClose={handleContextMenuClose}
        onStatusChange={handleStatusChange}
      />
    </DndProvider>
  );
}
