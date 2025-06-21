"use client";

import React, { useEffect, useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Appointment } from "@/types/appointment";

const TexasTimeZoneOffset = 5; // UTC-5 for Texas

const fetchAppointments = async (date?: string) => {
  try {
    let pDate = "";
    if (date) {
      let d = new Date(date);
      console.log("d: " + d + "; getHours(): " + new Date().getHours());
      if (new Date().getHours() + TexasTimeZoneOffset > 23) {
        d.setDate(d.getDate() - 1); // Adjust for Texas timezone offset
      }
      // console.log("HERE date:", d);
      // d.setDate(d.getDate());
      pDate = d.toISOString().split("T")[0];
    } else {
      const today = new Date();
      pDate = today.toISOString().split("T")[0];
    }
    console.log("HERE fetching appointments for date:", pDate);
    const url = pDate ? `/api/appointments?date=${pDate}` : "/api/appointments";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch appointments");
    }
    const data = await response.json();
    return data.map((appt: any) => ({
      ...appt,
      start: new Date(appt.start),
      end: new Date(appt.end),
    }));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

const createAppointment = async (appointment: Appointment) => {
  try {
    // const timezoneOffsetMinutes = new Date().getTimezoneOffset();
    // const timezoneOffsetMs = timezoneOffsetMinutes * 60 * 1000 * -1;

    // const prevDayStart = new Date(new Date(appointment.start).getTime());
    // const prevDayEnd = new Date(new Date(appointment.end).getTime());
    // appointment = { ...appointment, start: prevDayStart, end: prevDayEnd };
    console.log("HERE creating appointment:", appointment);
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      throw new Error("Failed to create appointment");
    }

    const data = await response.json();
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

const updateAppointment = async (appointment: Appointment) => {
  try {
    if (!appointment.id) {
      throw new Error("Appointment ID is required for updates");
    }

    // const timezoneOffsetMinutes = new Date().getTimezoneOffset();
    // const timezoneOffsetMs = timezoneOffsetMinutes * 60 * 1000 * -1;
    // const prevDayStart = new Date(
    //   new Date(appointment.start).getTime() + timezoneOffsetMs
    // );
    // const prevDayEnd = new Date(
    //   new Date(appointment.end).getTime() + timezoneOffsetMs
    // );
    // appointment = { ...appointment, start: prevDayStart, end: prevDayEnd };

    console.log("HERE updating appointment:", appointment);
    const response = await fetch(`/api/appointments`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      throw new Error("Failed to update appointment");
    }

    const data = await response.json();
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
    };
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
};

const deleteAppointment = async (appointment: Appointment) => {
  try {
    if (!appointment.id) {
      throw new Error("Appointment ID is required for deletion");
    }

    console.log("HERE deleting appointment:", appointment);
    const response = await fetch(`/api/appointments`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: appointment.id }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete appointment");
    }

    return true;
  } catch (error) {
    console.error("Error deleting appointment:", error);
    throw error;
  }
};

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
    appointment: Appointment,
    status: "booked" | "checked-in" | "finished"
  ) => void;
}) => {
  if (!isOpen || !appointment) return null;

  const handleStatusChange = (status: "booked" | "checked-in" | "finished") => {
    onStatusChange(appointment, status);
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

  if (!isSameDay(now, currentDate)) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 9 * 60;
  const endMinutes = 22 * 60;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) return null;

  const offsetMinutes = currentMinutes - startMinutes;

  const topPosition = offsetMinutes * 2;

  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
      style={{ top: `${topPosition + 49}px` }}
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
  onSave: (appointment: Omit<Appointment, "id">) => void; // This is already correct
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
    notes: "", // ADD THIS
    preference: "female" as "male" | "female" | "specific",
    specificWorker: "", // ADD THIS
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
        notes: "", // ADD THIS
        preference: "female", // ADD THIS
        specificWorker: "", // ADD THIS LINE
      });
    }
  }, [prefilledData]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

    if (form.preference === "specific" && !form.specificWorker) {
      alert("Please select a specific worker");
      return;
    }

    const startDate = new Date(`${form.date}T${form.start}`);
    const endDate = new Date(`${form.date}T${form.end}`);

    // Remove the id field since it's auto-generated
    const newAppointment: Omit<Appointment, "id"> = {
      phone: form.phone,
      massageType: form.massageType,
      customer: form.customer,
      start: startDate,
      end: endDate,
      status: "booked",
      notes: form.notes,
      preference: form.preference,
      specificWorker:
        form.preference === "specific" ? form.specificWorker : undefined,
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
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              placeholder="Special instructions or notes..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Massager Preference
            </label>
            <select
              name="preference"
              value={form.preference}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="specific">Specific Massager</option>
            </select>
          </div>

          {form.preference === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Specific Worker
              </label>
              <select
                name="specificWorker"
                value={form.specificWorker}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Specific Worker</option>
                {workers.map((worker) => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            </div>
          )}

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
  onDelete: (appointment: Appointment) => void; // This is correct
  workers: string[];
}) => {
  const [editForm, setEditForm] = useState({
    massageType: "",
    customer: "",
    phone: "",
    date: "",
    start: "",
    end: "",
    notes: "", // ADD THIS
    preference: "female" as "male" | "female" | "specific", // ADD THIS
    specificWorker: "", // ADD THIS LINE
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
        notes: appointment.notes || "", // ADD THIS
        preference: appointment.preference, // ADD THIS
        specificWorker: appointment.specificWorker || "", // ADD THIS LINE
      });
    }
  }, [appointment]);

  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

    if (editForm.preference === "specific" && !editForm.specificWorker) {
      alert("Please select a specific worker");
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
      notes: editForm.notes, // ADD THIS
      preference: editForm.preference, // ADD THIS
      specificWorker:
        editForm.preference === "specific"
          ? editForm.specificWorker
          : undefined, // ADD THIS LINE
    };

    onSave(updatedAppointment);
    onClose();
  };

  const handleDelete = () => {
    if (!appointment) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
      onDelete(appointment); // Pass full appointment object instead of ID
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
              Notes
            </label>
            <textarea
              name="notes"
              value={editForm.notes}
              onChange={handleEditFormChange}
              placeholder="Special instructions or notes..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Massager Preference
            </label>
            <select
              name="preference"
              value={editForm.preference}
              onChange={handleEditFormChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="specific">Specific Massager</option>
            </select>
          </div>
          {editForm.preference === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Specific Worker
              </label>
              <select
                name="specificWorker"
                value={editForm.specificWorker}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Specific Worker</option>
                {workers.map((worker) => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            </div>
          )}
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
  let borderColor = "border-blue-400";

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

  if (appointment.status === "booked" && appointment.preference === "male") {
    borderColor = "border-blue-800"; // dark blue
  } else if (
    appointment.status === "booked" &&
    appointment.preference === "female"
  ) {
    borderColor = "border-pink-500"; // pink
  } else if (
    appointment.status === "booked" &&
    appointment.preference === "specific"
  ) {
    borderColor = "border-yellow-300"; // light yellow
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
      {/* ADD PREFERENCE INDICATOR */}
      <div className="text-xs text-gray-500 capitalize">
        {appointment.preference === "specific" && appointment.specificWorker
          ? `Specific: ${appointment.specificWorker}`
          : appointment.preference === "specific"
          ? "Specific"
          : appointment.preference}
      </div>
      {/* ADD NOTES IF PRESENT */}
      {appointment.notes && (
        <div
          className="text-xs text-gray-500 truncate"
          title={appointment.notes}
        >
          Note: {appointment.notes}
        </div>
      )}
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
            key={
              appt.id ||
              `${appt.phone}-${appt.start.getTime()}-${appt.customer}`
            } // Use id as primary key
            appointment={appt}
            isFirst={isFirst}
            timeSlot={timeSlot}
            onAppointmentClick={onAppointmentClick}
            onContextMenu={onContextMenu}
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
      setCurrentDate(
        new Date(Date.now() - TexasTimeZoneOffset * 60 * 60 * 1000)
      ); // Adjust for Texas timezone offset
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

  const handleStatusChange = async (
    appointment: Appointment,
    status: "booked" | "checked-in" | "finished"
  ) => {
    const updatedAppointment: Appointment = {
      ...appointment,
      status,
    };

    try {
      await updateAppointment(updatedAppointment);
      const updatedAppointments = await fetchAppointments(
        currentDate.toISOString().split("T")[0]
      );
      setAppointments(updatedAppointments);
    } catch (error) {
      alert("Failed to update appointment status. Please try again.");
    }
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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
    notes: "", // ADD THIS
    preference: "female" as "male" | "female" | "specific", // ADD THIS
    specificWorker: "", // ADD THIS LINE
  });

  // Generate time slots for every 15 minutes from 9:00 to 21:45
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      try {
        const dateString = currentDate.toISOString().split("T")[0];
        const fetchedAppointments = await fetchAppointments(dateString);
        setAppointments(fetchedAppointments);
        console.log("Appointments loaded:", fetchedAppointments);
      } catch (error) {
        console.error("Failed to load appointments:", error);
        // Optionally show error message to user
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [currentDate]);

  const handleAddAppointment = async () => {
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

    if (form.preference === "specific" && !form.specificWorker) {
      alert("Please select a specific worker");
      return;
    }

    try {
      const startDate = new Date(`${form.date}T${form.start}`);
      const endDate = new Date(`${form.date}T${form.end}`);

      const appointmentData: Omit<Appointment, "id"> = {
        phone: form.phone,
        massageType: form.massageType,
        customer: form.customer,
        start: startDate,
        end: endDate,
        status: "booked",
        notes: form.notes,
        preference: form.preference,
        specificWorker:
          form.preference === "specific" ? form.specificWorker : undefined,
      };

      const newAppointment = await createAppointment(
        appointmentData as Appointment
      );
      if (!newAppointment) {
        alert("Failed to create appointment. Please try again.");
      }
      const updatedAppointments = await fetchAppointments(
        currentDate.toISOString().split("T")[0]
      );
      setAppointments(updatedAppointments);
      setShowForm(false);

      // Reset form
      setForm({
        massageType: "",
        customer: "",
        phone: "",
        date: currentDate.toISOString().slice(0, 10),
        start: "09:00",
        end: "10:00",
        notes: "",
        preference: "female",
        specificWorker: "",
      });
    } catch (error) {
      alert("Failed to create appointment. Please try again.");
    }
  };

  const handleQuickAddSave = async (
    appointmentData: Omit<Appointment, "id">
  ) => {
    try {
      const newAppointment = await createAppointment(
        appointmentData as Appointment
      );
      if (!newAppointment) {
        alert("Failed to create appointment. Please try again.");
      }
      const updatedAppointments = await fetchAppointments(
        currentDate.toISOString().split("T")[0]
      );
      setAppointments(updatedAppointments);
    } catch (error) {
      alert("Failed to create appointment. Please try again.");
    }
  };

  const handleDropAppointment = async (
    appt: Appointment,
    newDate: Date,
    newTimeSlot: { hour: number; minute: number },
    newWorker: string
  ) => {
    const newStart = new Date(newDate);
    newStart.setHours(newTimeSlot.hour, newTimeSlot.minute, 0, 0);
    const duration = appt.end.getTime() - appt.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    const updatedAppointment: Appointment = {
      ...appt,
      start: newStart,
      end: newEnd,
      customer: newWorker,
    };

    try {
      await updateAppointment(updatedAppointment);
      const updatedAppointments = await fetchAppointments(
        currentDate.toISOString().split("T")[0]
      );
      setAppointments(updatedAppointments);
    } catch (error) {
      alert("Failed to move appointment. Please try again.");
    }
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

  const handleAppointmentSave = async (updatedAppointment: Appointment) => {
    try {
      await updateAppointment(updatedAppointment);
      const updatedAppointments = await fetchAppointments(
        currentDate.toISOString().split("T")[0]
      );
      setAppointments(updatedAppointments);
    } catch (error) {
      alert("Failed to update appointment. Please try again.");
    }
  };

  const handleAppointmentDelete = async (appointment: Appointment) => {
    try {
      await deleteAppointment(appointment);
      setAppointments((prev) =>
        prev.filter((appt) => appt.id !== appointment.id)
      );
    } catch (error) {
      alert("Failed to delete appointment. Please try again.");
    }
  };

  const getAppointmentsForCell = (
    worker: string,
    timeSlot: { hour: number; minute: number }
  ) => {
    return appointments.filter((appt) => {
      if (appt.customer !== worker) {
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
      <nav className="bg-blue-500 bg-opacity-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <img src="favicon.ico" alt="" className="w-8 h-8" />
                <h1 className="text-white text-lg sm:text-xl font-bold">
                  Massage Scheduler
                </h1>
              </div>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-blue-200 p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-500 bg-opacity-50">
                <button className="text-white hover:text-blue-200 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                  Appointments
                </button>
                <button className="text-white hover:text-blue-200 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                  Customers
                </button>
                <button className="text-white hover:text-blue-200 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                  Orders
                </button>
                <button className="text-white hover:text-blue-200 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                  Reports
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  };

  // Add loading state to your render
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading appointments...</div>
      </div>
    );
  }
  return (
    <DndProvider backend={HTML5Backend}>
      <Navbar />
      <div className="p-2 sm:p-6 min-w-full">
        <div className="flex items-center justify-between mb-4 min-w-max">
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

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              placeholder="Notes"
              className="border p-2 rounded h-20 resize-none"
            />

            <select
              name="preference"
              value={form.preference}
              onChange={handleFormChange}
              className="border p-2 rounded"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="specific">Specific</option>
            </select>

            {/* Add this after the preference select field in the main form */}
            {form.preference === "specific" && (
              <select
                name="specificWorker"
                value={form.specificWorker}
                onChange={handleFormChange}
                className="border p-2 rounded"
              >
                <option value="">Select Specific Worker</option>
                {workers.map((worker) => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            )}

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

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 w-full max-w-full">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong>{" "}
            <span>
              Drag worker column headers to rearrange the order. Drag
              appointments to reschedule them to different workers or time
              slots. Click on appointments to edit or delete them. Click on
              empty cells to quickly add new appointments.
            </span>
          </p>
        </div>

        <div
          className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white relative"
          style={{ minWidth: "800px" }}
        >
          <CurrentTimeLine currentDate={currentDate} />
          <table
            className="w-full border-separate border-spacing-0"
            style={{ minWidth: "800px" }}
          >
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
