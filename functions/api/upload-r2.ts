export const onRequestPost = async (context: any) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se envió ningún archivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generar nombre de archivo único
    const extension = file.name.split('.').pop() || 'jpg';
    const claveArchivo = `evidencias/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

    // Subir directo al bucket R2 enlazado en Cloudflare Pages
    await context.env.CHECKPOINT_BUCKET.put(claveArchivo, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || 'image/jpeg',
      },
    });

    // Reemplaza con la URL pública de tu bucket de R2
    const urlPublica = `https://pub-TU_ID_AQUI.r2.dev/${claveArchivo}`;

    return new Response(JSON.stringify({ url: urlPublica }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};