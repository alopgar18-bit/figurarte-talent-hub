const BUCKET_FOTOS = "candidatos-fotos";
const DURACION_URL_FIRMADA_SEGUNDOS = 60 * 60;

function esUrlExterna(valor: string): boolean {
  return /^https?:\/\//i.test(valor);
}

export async function firmarFotosPrivadas(
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
      };
    };
  },
  fotos: string[] | null | undefined,
): Promise<string[]> {
  return Promise.all(
    (fotos ?? []).map(async (foto) => {
      if (foto.startsWith("placeholder://") || esUrlExterna(foto)) return foto;

      const { data, error } = await supabase.storage
        .from(BUCKET_FOTOS)
        .createSignedUrl(foto, DURACION_URL_FIRMADA_SEGUNDOS);

      if (error || !data?.signedUrl) {
        console.error(`[fotos] No se pudo firmar la ruta privada: ${foto}`);
        return foto;
      }
      return data.signedUrl;
    }),
  );
}