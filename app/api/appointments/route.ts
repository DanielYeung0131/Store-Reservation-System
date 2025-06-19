import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { Appointment } from "../../../types/appointment";

// GET: Fetch appointments
export async function GET(request: NextRequest) {
  console.log("Fetching appointments inside GET handler");

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let query = `
      SELECT 
      id,
        massageType,
        phone,
        start,
        end,
        customer,
        status,
        notes,
        preference,
        specificWorker
      FROM appointments
    `;

    const queryParams: any[] = [];

    if (date) {
      query += " WHERE DATE(start) = ?";
      queryParams.push(date);
    }

    query += " ORDER BY start ASC";

    const [rows] = await db.query(query, queryParams);

    const appointments = (rows as any[]).map((row) => ({
      ...row,
      start: new Date(row.start),
      end: new Date(row.end),
    }));

    // console.log("Appointments fetched successfully:", appointments);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { message: "Error fetching appointments", error },
      { status: 500 }
    );
  }
}

// POST: Create new appointment
export async function POST(request: NextRequest) {
  try {
    const appointment = await request.json();

    // console.log("Creating appointment:", appointment);

    const query = `
      INSERT INTO appointments (
        massageType, phone, start, end, customer, 
        status, notes, preference, specificWorker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log("Appointment created successfully:", appointment);

    const values = [
      appointment.massageType,
      appointment.phone,
      appointment.start,
      appointment.end,
      appointment.customer,
      appointment.status,
      appointment.notes || null,
      appointment.preference,
      appointment.specificWorker || null,
    ];

    await db.query(query, values);

    // console.log("Appointment created successfully:", appointment);

    // No id to fetch, just return the appointment data
    const responseAppointment = {
      ...appointment,
      start: new Date(appointment.start),
      end: new Date(appointment.end),
    };

    return NextResponse.json(responseAppointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { message: "Error creating appointment", error },
      { status: 500 }
    );
  }
}

// PUT: Update existing appointment
export async function PUT(request: NextRequest) {
  try {
    const appointment: Appointment = await request.json();

    if (!appointment.id) {
      return NextResponse.json(
        { message: "Appointment ID is required for updates" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE appointments
      SET
        massageType = ?,
        phone = ?,
        start = ?,
        end = ?,
        customer = ?,
        status = ?,
        notes = ?,
        preference = ?,
        specificWorker = ?
      WHERE id = ?
    `;

    const values = [
      appointment.massageType,
      appointment.phone,
      appointment.start,
      appointment.end,
      appointment.customer,
      appointment.status,
      appointment.notes || null,
      appointment.preference,
      appointment.specificWorker || null,
      appointment.id,
    ];

    const [result]: any = await db.query(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No matching appointment found to update" },
        { status: 404 }
      );
    }

    const responseAppointment = {
      ...appointment,
      start: new Date(appointment.start),
      end: new Date(appointment.end),
    };

    return NextResponse.json(responseAppointment, { status: 200 });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { message: "Error updating appointment", error },
      { status: 500 }
    );
  }
}

// DELETE: Delete appointment by ID
export async function DELETE(request: NextRequest) {
  try {
    const deleteItem = await request.json();
    console.log("Received delete request for appointment:", deleteItem);

    const query = `
      DELETE FROM appointments
      WHERE
        id = ?
    `;

    // Convert dates to ISO strings for consistent comparison
    const values = [deleteItem.id];

    const [result]: any = await db.query(query, values);

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No matching appointment found to delete" },
        { status: 404 }
      );
    }

    console.log("Successfully deleted appointment");
    return NextResponse.json(
      { message: "Appointment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      {
        message: "Error deleting appointment",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
