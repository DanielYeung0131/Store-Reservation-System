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

    console.log("Appointments fetched successfully:", appointments);
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
    const appointment: Omit<Appointment, "id"> = await request.json();

    const query = `
      INSERT INTO appointments (
        massageType, phone, start, end, customer, 
        status, notes, preference, specificWorker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ];

    await db.query(query, values);

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
    const { searchParams } = new URL(request.url);
    // id is not used anymore
    // const id = searchParams.get("id");
    const appointment: Appointment = await request.json();

    // Remove id check
    // if (!id) {
    //   return NextResponse.json(
    //     { message: "Appointment ID is required" },
    //     { status: 400 }
    //   );
    // }

    // You need a way to identify which appointment to update if there's no id.
    // If not possible, you may want to reject the request.
    return NextResponse.json(
      { message: "Cannot update appointment without an identifier" },
      { status: 400 }
    );
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
    // id is not used anymore
    // const { searchParams } = new URL(request.url);
    // const id = searchParams.get("id");

    // Remove id check
    // if (!id) {
    //   return NextResponse.json(
    //     { message: "Appointment ID is required" },
    //     { status: 400 }
    //   );
    // }

    // You need a way to identify which appointment to delete if there's no id.
    // If not possible, you may want to reject the request.
    return NextResponse.json(
      { message: "Cannot delete appointment without an identifier" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { message: "Error deleting appointment", error },
      { status: 500 }
    );
  }
}
