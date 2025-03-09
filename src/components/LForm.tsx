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
      console.error(error);
      toast("Error", {
        description: `Hubo un error al iniciar sesión: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle error codes
  function handleError(code: string): string {
    const errorMessages: Record<string, string> = {
      anonymous_provider_disabled:
        "Las sesiones anónimas están deshabilitadas.",
      bad_code_verifier:
        "Error en la verificación del código. Intenta nuevamente.",
      bad_json: "El cuerpo de la solicitud no es un JSON válido.",
      bad_jwt: "El token JWT no es válido.",
      bad_oauth_callback: "Error en el callback de OAuth.",
      bad_oauth_state: "El estado de OAuth no es válido.",
      captcha_failed: "La verificación del captcha falló.",
      conflict: "Conflicto en la base de datos. Intenta nuevamente.",
      email_address_invalid: "La dirección de correo electrónico no es válida.",
      email_address_not_authorized:
        "No se permite enviar correos a esta dirección.",
      email_conflict_identity_not_deletable:
        "No se puede desvincular esta identidad.",
      email_exists: "La dirección de correo electrónico ya existe.",
      email_not_confirmed: "El correo electrónico no ha sido confirmado.",
      email_provider_disabled:
        "Los registros de correo electrónico están deshabilitados.",
      flow_state_expired:
        "El estado del flujo ha expirado. Intenta nuevamente.",
      flow_state_not_found: "El estado del flujo no se encontró.",
      hook_payload_invalid_content_type:
        "El tipo de contenido del payload no es válido.",
      hook_payload_over_size_limit:
        "El payload excede el límite de tamaño máximo.",
      hook_timeout: "No se pudo alcanzar el hook dentro del tiempo máximo.",
      hook_timeout_after_retry:
        "No se pudo alcanzar el hook después de varios intentos.",
      identity_already_exists: "La identidad ya está vinculada a un usuario.",
      identity_not_found: "La identidad no se encontró.",
      insufficient_aal: "Se requiere un nivel de autenticación más alto.",
      invite_not_found: "La invitación ha expirado o ya ha sido utilizada.",
      invalid_credentials:
        "Credenciales de inicio de sesión no válidas. Verifica tu correo y contraseña.",
      manual_linking_disabled:
        "El enlace manual de usuarios está deshabilitado.",
      mfa_challenge_expired: "El desafío MFA ha expirado.",
      mfa_factor_name_conflict:
        "Los factores MFA no deben tener el mismo nombre.",
      mfa_factor_not_found: "El factor MFA no se encontró.",
      mfa_ip_address_mismatch:
        "La inscripción de MFA debe comenzar y terminar con la misma IP.",
      mfa_phone_enroll_not_enabled:
        "La inscripción de factores MFA por teléfono está deshabilitada.",
      mfa_phone_verify_not_enabled:
        "La verificación de factores MFA por teléfono está deshabilitada.",
      mfa_totp_enroll_not_enabled:
        "La inscripción de factores TOTP está deshabilitada.",
      mfa_totp_verify_not_enabled:
        "La verificación de factores TOTP está deshabilitada.",
      mfa_verification_failed: "La verificación del desafío MFA falló.",
      mfa_verification_rejected: "La verificación MFA fue rechazada.",
      mfa_verified_factor_exists: "Ya existe un factor de teléfono verificado.",
      mfa_web_authn_enroll_not_enabled:
        "La inscripción de factores WebAuthn está deshabilitada.",
      mfa_web_authn_verify_not_enabled:
        "La verificación de factores WebAuthn está deshabilitada.",
      no_authorization: "Se requiere un encabezado de autorización.",
      not_admin: "El usuario no tiene permisos de administrador.",
      oauth_provider_not_supported: "El proveedor OAuth está deshabilitado.",
      otp_disabled: "El inicio de sesión con OTP está deshabilitado.",
      otp_expired: "El código OTP ha expirado.",
      over_email_send_rate_limit:
        "Se han enviado demasiados correos a esta dirección.",
      over_request_rate_limit:
        "Se han enviado demasiadas solicitudes desde esta IP.",
      over_sms_send_rate_limit: "Se han enviado demasiados SMS a este número.",
      phone_exists: "El número de teléfono ya existe.",
      phone_not_confirmed:
        "El inicio de sesión no está permitido, el número no está confirmado.",
      phone_provider_disabled:
        "Los registros de teléfono están deshabilitados.",
      provider_disabled: "El proveedor OAuth está deshabilitado.",
      provider_email_needs_verification:
        "Se requiere verificación del correo electrónico.",
      reauthentication_needed: "Se requiere reautenticación.",
      reauthentication_not_valid: "La verificación de reautenticación falló.",
      refresh_token_not_found: "No se encontró el token de actualización.",
      refresh_token_already_used: "El token de actualización ha sido revocado.",
      request_timeout:
        "El procesamiento de la solicitud tomó demasiado tiempo.",
      same_password: "La nueva contraseña debe ser diferente de la actual.",
      saml_assertion_no_email:
        "No se encontró una dirección de correo electrónico en la afirmación SAML.",
      saml_assertion_no_user_id:
        "No se encontró un ID de usuario en la afirmación SAML.",
      saml_entity_id_mismatch: "El ID de entidad SAML no coincide.",
      saml_idp_already_exists: "El proveedor de identidad SAML ya existe.",
      saml_idp_not_found: "El proveedor de identidad SAML no se encontró.",
      saml_metadata_fetch_failed:
        "No se pudo obtener los metadatos del proveedor SAML.",
      saml_provider_disabled: "El uso de SSO con SAML está deshabilitado.",
      saml_relay_state_expired: "El estado de relé SAML ha expirado.",
      saml_relay_state_not_found: "El estado de relé SAML no se encontró.",
      session_expired: "La sesión ha expirado.",
      session_not_found: "La sesión no se encontró.",
      signup_disabled: "Los registros de nuevos usuarios están deshabilitados.",
      single_identity_not_deletable:
        "No se puede eliminar la única identidad de un usuario.",
      sms_send_failed: "El envío de SMS falló.",
      sso_domain_already_exists: "Ya existe un dominio SSO registrado.",
      sso_provider_not_found: "El proveedor SSO no se encontró.",
      too_many_enrolled_mfa_factors:
        "Se ha alcanzado el número máximo de factores MFA.",
      unexpected_audience: "El público del JWT no coincide.",
      unexpected_failure: "Error inesperado en el servicio de autenticación.",
      user_already_exists: "El usuario ya existe.",
      user_banned: "El usuario está prohibido.",
      user_not_found: "El usuario no se encontró.",
      user_sso_managed:
        "El usuario proviene de SSO y no se pueden actualizar ciertos campos.",
      validation_failed:
        "Los parámetros proporcionados no están en el formato esperado.",
      weak_password: "La contraseña no cumple con los criterios de seguridad.",
    };

    return errorMessages[code] || "Error desconocido. Intenta nuevamente."; // Default message for unknown errors
  }

  return (
    <>
      <Toaster />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar sesion</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para iniciar sesion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
    </>
  );
}
