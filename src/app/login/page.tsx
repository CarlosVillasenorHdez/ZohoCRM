import { FormularioLogin } from "./formulario";
import { ultimoUsuario } from "./actions";

export const dynamic = "force-dynamic";

export default async function Login() {
  const ultimo = await ultimoUsuario();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-9">
        <h1 className="text-3xl font-semibold tracking-tight">Cartera</h1>
        <p className="mt-2 text-tinta-suave">
          Tus citas, seguimientos y renovaciones del día.
        </p>
      </div>
      <FormularioLogin ultimoUsuario={ultimo} />
    </main>
  );
}
