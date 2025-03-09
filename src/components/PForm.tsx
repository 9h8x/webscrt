"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { supabase } from "../lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Utility function for className merging
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

type School = {
  id: number;
  nombre: string;
  departamento: string;
  localidad: string;
};

export default function SchoolSelectionAndPost() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [nombres, setNombres] = useState<string[]>([]);

  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>("");
  const [selectedNombre, setSelectedNombre] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [content, setContent] = useState("");
  const [titulo, setTitle] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fetch schools data
  useEffect(() => {
    async function fetchSchools() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("schools")
          .select("id, nombre, departamento, localidad");

        if (error) {
          throw error;
        }

        setSchools(data || []);

        // Allowlist of departamentos to include (uppercase for comparison)
        const allowedDepartamentos = ["CONCORDIA"];

        // Extract unique departamentos that are in the allowlist (case insensitive)
        const uniqueDepartamentos = [
          ...new Set(
            data
              ?.map((school) => school.departamento)
              .filter((departamento) =>
                allowedDepartamentos.includes(departamento?.toUpperCase())
              )
          ),
        ];
        setDepartamentos(uniqueDepartamentos);
      } catch (error) {
        console.error("Error fetching schools:", error);
        setError("Failed to load schools data");
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  // Update localidades when departamento changes
  useEffect(() => {
    if (selectedDepartamento) {
      const filteredLocalidades = [
        ...new Set(
          schools
            .filter((school) => school.departamento === selectedDepartamento)
            .map((school) => school.localidad)
        ),
      ];
      setLocalidades(filteredLocalidades);
      setSelectedLocalidad("");
      setSelectedNombre("");
      setSelectedSchool(null);
    } else {
      setLocalidades([]);
    }
  }, [selectedDepartamento, schools]);

  // Update nombres when localidad changes
  useEffect(() => {
    if (selectedDepartamento && selectedLocalidad) {
      const filteredNombres = schools
        .filter(
          (school) =>
            school.departamento === selectedDepartamento &&
            school.localidad === selectedLocalidad
        )
        .map((school) => school.nombre);
      setNombres(filteredNombres);
      setSelectedNombre("");
      setSelectedSchool(null);
    } else {
      setNombres([]);
    }
  }, [selectedLocalidad, selectedDepartamento, schools]);

  // Update selected school when nombre changes
  useEffect(() => {
    if (selectedDepartamento && selectedLocalidad && selectedNombre) {
      const school =
        schools.find(
          (school) =>
            school.departamento === selectedDepartamento &&
            school.localidad === selectedLocalidad &&
            school.nombre === selectedNombre
        ) || null;
      setSelectedSchool(school);
    } else {
      setSelectedSchool(null);
    }
  }, [selectedNombre, selectedDepartamento, selectedLocalidad, schools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) {
      toast("Seleccion de escuela necesario", {
        description: "Selecciona una escuela antes de enviar.",
      });
      return;
    }
    if (!content || !titulo) {
      toast("Formulario incompleto", {
        description: "Llena todos los campos.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/create-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          schoolId: selectedSchool.id,
          titulo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast("Post creado", {
          description: `Tu post fue creado correctamente.`,
        });
        // Reset form
        setContent("");
        setTitle("");
        setSelectedDepartamento("");
        setSelectedLocalidad("");
        setSelectedNombre("");
        setSelectedSchool(null);
      } else {
        throw new Error(data.error || "No se pudo crear el post");
      }
    } catch (error) {
      console.error("Error creando post:", error);
      toast("No se pudo crear el post", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Auto-select the departamento if there's only one
    if (departamentos.length === 1 && !selectedDepartamento) {
      setSelectedDepartamento(departamentos[0]);
    }
  }, [departamentos, selectedDepartamento]);

  if (loading)
    return (
      <div className="container mx-auto p-4">
        <section
          aria-label="Notifications alt+T"
          tabIndex={-1}
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
        />

        <div className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>

          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  if (error)
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Crear nuevo post</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`grid grid-cols-1 ${
            departamentos.length > 1 ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-4`}
        >
          {departamentos.length > 1 && (
            <ResponsiveComboBox
              label="Departamento"
              options={departamentos}
              value={selectedDepartamento}
              onChange={setSelectedDepartamento}
              placeholder="Seleccionar Departamento"
              isDesktop={isDesktop}
            />
          )}

          <ResponsiveComboBox
            label="Localidad"
            options={localidades}
            value={selectedLocalidad}
            onChange={setSelectedLocalidad}
            placeholder="Seleccionar Localidad"
            disabled={!selectedDepartamento}
            isDesktop={isDesktop}
          />

          <ResponsiveComboBox
            label="Escuela"
            options={nombres}
            value={selectedNombre}
            onChange={setSelectedNombre}
            placeholder="Seleccionar Escuela"
            disabled={!selectedLocalidad}
            isDesktop={isDesktop}
          />
        </div>

        {/* Content Textarea */}
        <div className="space-y-2">
          <Label htmlFor="content">Contenido</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingresa el contenido de tu post"
            rows={4}
          />
        </div>

        {/* Titulo Input */}
        <div className="space-y-2">
          <Label htmlFor="titulo">Titulo</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ingresa el titulo de tu post"
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear"}
        </Button>
      </form>
    </div>
  );
}

function ResponsiveComboBox({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  isDesktop = true,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  isDesktop?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const formattedValue = value
    ? value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const formattedPlaceholder = placeholder
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const displayValue = formattedValue || formattedPlaceholder;

  const SelectionList = ({
    setOpen,
    onChange,
  }: {
    setOpen: (open: boolean) => void;
    onChange: (value: string) => void;
  }) => (
    <Command>
      <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
      <CommandList>
        <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option}
              value={option}
              onSelect={(currentValue) => {
                onChange(currentValue);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === option ? "opacity-100" : "opacity-0"
                )}
              />
              {option.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isDesktop) {
    return (
      <div className="space-y-2">
        <Label htmlFor={label}>
          {label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              <div className="flex items-center w-full">
                <span className="truncate">{displayValue}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <SelectionList setOpen={setOpen} onChange={onChange} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>
        {label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
      </Label>
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center w-full">
              <span className="truncate">{displayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="fixed-drawer">
          <div className="mt-4 border-t">
            <SelectionList setOpen={setOpen} onChange={onChange} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
