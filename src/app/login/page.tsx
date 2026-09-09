import { FormularioLogin } from "./formulario";

export default function Login() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Cartera</h1>
        <p className="mt-2 text-tinta-suave">
          Tus citas, seguimientos y renovaciones del día.
        </p>
      </div>
      <FormularioLogin />
    </main>
  );
}
