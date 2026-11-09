"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Images, ImagePlus, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClientPhoto {
  id: string;
  url: string;
}

function isClientPhoto(value: unknown): value is ClientPhoto {
  if (!value || typeof value !== "object") return false;
  const photo = value as Record<string, unknown>;
  return typeof photo.id === "string" && photo.id.length > 0 && typeof photo.url === "string" && photo.url.length > 0;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ClientPhotos({ clientId }: { clientId: string }) {
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [photoToDelete, setPhotoToDelete] = useState<ClientPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const endpoint = `/api/clients/${encodeURIComponent(clientId)}/photos`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPhotos([]);
    setListError(null);
    apiClient.get<ClientPhoto[]>(endpoint).then((response) => {
      if (!active) return;
      if (response.error || !Array.isArray(response.data) || !response.data.every(isClientPhoto)) {
        setListError(response.error || "El servidor devolvió fotografías con un formato inválido.");
      } else {
        setPhotos(response.data);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [endpoint, retry]);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Selecciona únicamente archivos de imagen.");
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("Cada fotografía debe pesar como máximo 10 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    for (const file of files) {
      const body = new FormData();
      body.append("photo", file);
      const response = await apiClient.upload<ClientPhoto>(endpoint, body);
      if (response.error || !isClientPhoto(response.data)) {
        setError(response.error || "El servidor devolvió una fotografía con un formato inválido.");
        break;
      }
      const photo = response.data;
      setPhotos((current) => [...current, photo]);
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!photoToDelete || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    const response = await apiClient.delete(`${endpoint}/${encodeURIComponent(photoToDelete.id)}`);
    setDeleting(false);
    if (response.error) {
      setDeleteError(`No se pudo eliminar la fotografía: ${response.error}`);
      return;
    }
    setPhotos((current) => current.filter((photo) => photo.id !== photoToDelete.id));
    setPhotoToDelete(null);
  };

  return (
    <Card className="border-gray-700 bg-gray-900">
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl text-white">Fotografías</CardTitle>
          <CardDescription className="text-gray-400">Guarda fotos de los objetos y del espacio de este cliente.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading || uploading || !!listError} onClick={() => cameraInput.current?.click()} className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700">
            <Camera aria-hidden="true" /> Usar cámara
          </Button>
          <Button type="button" disabled={loading || uploading || !!listError} onClick={() => fileInput.current?.click()} className="bg-blue-600 text-white hover:bg-blue-700">
            <ImagePlus aria-hidden="true" /> Agregar fotos
          </Button>
        </div>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleFiles} className="hidden" aria-label="Tomar una fotografía" />
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" aria-label="Seleccionar fotografías" />
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="mb-4 rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-400">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-400">Cargando fotografías...</p>
        ) : listError ? (
          <div role="alert" className="space-y-3 text-sm text-red-400">
            <p>No se pudieron cargar las fotografías: {listError}</p>
            <Button type="button" variant="outline" onClick={() => setRetry((current) => current + 1)} className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700">Reintentar</Button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
            <Images aria-hidden="true" className="mb-3 size-8 text-gray-500" />
            <p className="text-sm text-gray-300">Todavía no hay fotografías.</p>
            <p className="mt-1 text-xs text-gray-500">Usa la cámara o selecciona imágenes de tu dispositivo. Máximo 10 MB por imagen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative overflow-hidden rounded-lg border border-gray-700">
                <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" aria-label={`Abrir fotografía ${index + 1} en una nueva pestaña`}>
                  <img src={photo.url} alt={`Fotografía ${index + 1} del cliente`} className="aspect-square w-full object-cover transition-transform hover:scale-105" />
                </a>
                <Button type="button" variant="destructive" size="icon" aria-label={`Eliminar fotografía ${index + 1}`} title="Eliminar fotografía" onClick={() => { setDeleteError(null); setPhotoToDelete(photo); }} className="absolute right-2 top-2 shadow-md">
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {uploading && <p role="status" className="mt-4 text-sm text-gray-400">Guardando fotografías...</p>}
        <Dialog open={photoToDelete !== null} onOpenChange={(open) => { if (!open && !deleting) { setPhotoToDelete(null); setDeleteError(null); } }}>
          <DialogContent className="border-gray-700 bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-white">Eliminar fotografía</DialogTitle>
              <DialogDescription className="text-gray-400">¿Confirmas que deseas eliminar esta fotografía? Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            {deleteError && <p role="alert" className="text-sm text-red-400">{deleteError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={deleting} onClick={() => setPhotoToDelete(null)}>Cancelar</Button>
              <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>{deleting ? "Eliminando..." : "Eliminar fotografía"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
