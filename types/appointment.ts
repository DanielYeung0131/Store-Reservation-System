export interface Appointment {
  id: number;
  phone: string;
  massageType: string;
  customer: string;
  start: Date;
  end: Date;
  status: "booked" | "checked-in" | "finished";
  notes?: string;
  preference: "male" | "female" | "specific";
  specificWorker?: string;
}
