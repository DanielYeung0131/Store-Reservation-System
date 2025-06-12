"use client";

import React, { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export type Appointment = {
  id: string;
  massageType: string;
  phone: string;
  start: Date;
  end: Date;
  customer: string;
};

let mockAppointments: Appointment[] = [
  {
    id: "1",
    massageType: "Swedish Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 10, 0),
    end: new Date(2025, 5, 12, 11, 30), // 1.5 hour appointment
    customer: "Alice",
  },
  {
    id: "2",
    massageType: "Deep Tissue Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 12, 0),
    end: new Date(2025, 5, 12, 14, 0), // 2 hour appointment
    customer: "Bob",
  },
  {
    id: "3",
    massageType: "Hot Stone Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 12, 9, 30),
    end: new Date(2025, 5, 12, 10, 30), // 1 hour appointment
    customer: "Carol",
  },
];

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
  return Math.max(duration * 80, 20); // 80px per hour, minimum 20px
}

function getAppointmentTop(
  appointment: Appointment,
  timeSlot: { hour: number; minute: number }
): number {
  const appointmentMinutes =
    appointment.start.getHours() * 60 + appointment.start.getMinutes();
  const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
  const offsetMinutes = appointmentMinutes - slotMinutes;
  return (offsetMinutes / 60) * 80; // 80px per hour
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

    const newAppointment = {
      massageType: form.massageType,
      customer: form.customer,
      phone: form.phone,
      start: startDate,
      end: endDate,
    };

    onSave(newAppointment);
    onClose();
  };

  if (!isOpen || !prefilledData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

const DraggableAppointment = ({
  appointment,
  isFirst,
  timeSlot,
  onAppointmentClick,
}: {
  appointment: Appointment;
  isFirst: boolean;
  timeSlot: { hour: number; minute: number };
  onAppointmentClick: (appointment: Appointment) => void;
}) => {
  const [, dragRef] = useDrag({
    type: "APPOINTMENT",
    item: { appointment },
  });

  const divRef = React.useRef<HTMLDivElement>(null);

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

  if (!isFirst) {
    return null; // Only render the appointment in the first cell
  }

  const height = getAppointmentHeight(appointment);
  const top = getAppointmentTop(appointment, timeSlot);

  return (
    <div
      ref={divRef}
      onClick={handleClick}
      className="absolute bg-blue-100 border-l-4 border-blue-500 p-2 rounded shadow text-sm cursor-pointer z-10 hover:bg-blue-200 transition-colors"
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
    // Only trigger cell click if we didn't click on an appointment
    if (appointmentsForCell.length === 0) {
      onCellClick(worker, date, timeSlot);
    }
  };

  return (
    <td
      ref={tdRef}
      className="border p-0 align-top relative cursor-pointer hover:bg-blue-50 transition-colors"
      style={{ height: "20px" }}
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
          />
        );
      })}
    </td>
  );
};

export default function DashboardPage() {
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
      <nav className="bg-blue-300 bg-opacity-30 shadow-lg">
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
                Dashboard
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Appointments
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Workers
              </button>
              <button className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                Settings
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

        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
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
    </DndProvider>
  );
}
