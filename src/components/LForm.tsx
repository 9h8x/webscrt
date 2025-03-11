"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BorderBeam } from "@/components/magicui/border-beam";

const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Ingresa una direccion de correo electronico valida." }),
  password: z.string().min(6, {
    message: "La contraseña tiene que tener un minimo de 6 caracteres.",
  }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams(values).toString(); // Convert to URL-encoded format

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        let errorMessage = "Error desconocido. Intenta nuevamente."; // Default message

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json(); // Parse as JSON
          errorMessage = handleError(errorData.code); // Handle the error
        } else {
          // If not JSON, read the response as text
          const errorText = await response.text();
          errorMessage = `Error: ${errorText}`; // Use the plain text error
        }

        throw new Error(errorMessage);
      }

      // If the response is successful, redirect to the dashboard
      window.location.href = "/admin/dashboard"; // Perform the redirect
    } catch (error) {
      toast("Error", {
        description: `Hubo un error al iniciar sesión, revisa tu correo y contraseña y vuelve a intentar.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Toaster />
      <div className="relative w-full max-w-md mx-auto">
        <Card className="w-full relative">
          <BorderBeam duration={8} size={100} />
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar sesion</CardTitle>
            <CardDescription>
              Ingresa tu correo y contraseña para iniciar sesion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="nombre@ejemplo.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesion...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
