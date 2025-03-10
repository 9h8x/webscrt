import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type School = {
  id: number;
  nombre: string;
  departamento: string;
  localidad: string;
};

export function getSchoolByID(id: number, schools: School[] | null) {
  if (!schools) {
    return null;
  }
  return schools.find((school) => school.id === id);
}
