"use client";

import React, { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export type Appointment = {
  massageType: string;
  phone: string;
  start: Date;
  end: Date;
  customer: string;
};

let mockAppointments: Appointment[] = [
  {
    massageType: "Swedish Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 11, 10, 0),
    end: new Date(2025, 5, 11, 11, 0),
    customer: "Alice",
  },
  {
    massageType: "Deep Tissue Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 11, 12, 0),
    end: new Date(2025, 5, 11, 13, 0),
    customer: "Bob",
  },
  {
    massageType: "Hot Stone Massage",
    phone: "123-456-7890",
    start: new Date(2025, 5, 11, 9, 30),
    end: new Date(2025, 5, 11, 10, 30),
    customer: "Carol",
  },
];

// ✅ List of workers (new)
const workers = ["Alice", "Bob", "Carol"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DraggableAppointment = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const [, dragRef] = useDrag({
    type: "APPOINTMENT",
    item: { appointment },
  });

  return (
    <div
      ref={dragRef}
      className="bg-blue-100 border-l-4 border-blue-500 p-2 mb-1 rounded shadow text-sm cursor-move"
    >
      <div className="font-semibold">{appointment.massageType}</div>
      <div>
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
      <div className="text-gray-600">{appointment.customer}</div>
    </div>
  );
};

const DroppableCell = ({
  date,
  hour,
  worker,
  onDropAppointment,
  appointmentsForCell,
}: {
  date: Date;
  hour: number;
  worker: string;
  onDropAppointment: (
    appt: Appointment,
    newDate: Date,
    newHour: number,
    newWorker: string
  ) => void;
  appointmentsForCell: Appointment[];
}) => {
  const [, dropRef] = useDrop({
    accept: "APPOINTMENT",
    drop: (item: { appointment: Appointment }) => {
      onDropAppointment(item.appointment, date, hour, worker);
    },
  });

  return (
    <td ref={dropRef} className="border p-2 align-top h-20 relative">
      {appointmentsForCell.map((appt) => (
        <DraggableAppointment
          key={appt.customer + appt.start.toISOString()}
          appointment={appt}
        />
      ))}
    </td>
  );
};

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] =
    useState<Appointment[]>(mockAppointments);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    massageType: "",
    customer: "",
    phone: "",
    date: currentDate.toISOString().slice(0, 10),
    start: "09:00",
    end: "10:00",
  });

  const hours = Array.from({ length: 13 }, (_, i) => 9 + i);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(`${form.date}T${form.start}`);
    const endDate = new Date(`${form.date}T${form.end}`);
    const newAppointment: Appointment = {
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

  const handleDropAppointment = (
    appt: Appointment,
    newDate: Date,
    newHour: number,
    newWorker: string
  ) => {
    const newStart = new Date(newDate);
    newStart.setHours(newHour, 0, 0, 0);
    const duration = appt.end.getTime() - appt.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    setAppointments((prev) =>
      prev.map((a) =>
        a === appt
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

  return (
    <DndProvider backend={HTML5Backend}>
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
          <form
            onSubmit={handleAddAppointment}
            className="mb-4 p-4 border rounded bg-gray-50 flex flex-wrap gap-2 items-end"
          >
            <input
              name="massageType"
              value={form.massageType}
              onChange={handleFormChange}
              placeholder="Massage Type"
              required
              className="border p-2 rounded"
            />
            <input
              name="customer"
              value={form.customer}
              onChange={handleFormChange}
              placeholder="Assigned Worker"
              required
              className="border p-2 rounded"
            />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="Phone"
              required
              className="border p-2 rounded"
            />
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              required
              className="border p-2 rounded"
            />
            <input
              type="time"
              name="start"
              value={form.start}
              onChange={handleFormChange}
              required
              className="border p-2 rounded"
            />
            <input
              type="time"
              name="end"
              value={form.end}
              onChange={handleFormChange}
              required
              className="border p-2 rounded"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 w-20 bg-gray-100"></th>
                {workers.map((worker) => (
                  <th key={worker} className="border p-2 bg-gray-100">
                    {worker}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="border p-2 text-right align-top bg-gray-50">
                    {hour}:00
                  </td>
                  {workers.map((worker) => {
                    const cellAppointments = appointments.filter(
                      (appt) =>
                        appt.customer === worker &&
                        isSameDay(appt.start, currentDate) &&
                        appt.start.getHours() === hour
                    );
                    return (
                      <DroppableCell
                        key={worker + hour}
                        date={currentDate}
                        hour={hour}
                        worker={worker}
                        onDropAppointment={handleDropAppointment}
                        appointmentsForCell={cellAppointments}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndProvider>
  );
}
