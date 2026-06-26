import { useCallback, useEffect, useRef, useState } from "react";
import { Button, SearchField, Spinner } from "@heroui/react";
import { ImagePlus, Upload } from "lucide-react";
import {
  fetchMediaAssets,
  fileToMediaUpload,
  uploadMediaAsset,
  type MediaAsset,
} from "../../api/admin-media.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { getErrorMessage } from "../../lib/errors.js";
import { EX } from "../../config/fieldExamples.js";
import { AppModal } from "../ui/AppModal.js";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
};

export function MediaPickerModal({ open, onClose, onSelect, title = "Biblioteca de imágenes" }: Props) {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    try {
      const list = await fetchMediaAssets(token, { q: query.trim() || undefined });
      setAssets(list);
    } catch (err) {
      toastError(getErrorMessage(err, "Error al cargar imágenes"));
    } finally {
      setLoading(false);
    }
  }, [token, open, query, toastError]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [open, load]);

  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const payload = await fileToMediaUpload(file);
      const created = await uploadMediaAsset(token, payload);
      success("Imagen subida");
      setAssets((prev) => [created, ...prev]);
    } catch (err) {
      toastError(getErrorMessage(err, "No se pudo subir la imagen"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppModal
      open={open}
      title={title}
      subtitle="Busca por nombre o etiqueta, o sube una imagen nueva"
      onClose={onClose}
      hideFooter
      size="xl"
    >
      <div className="flex flex-col gap-4">
        <div className="fortino-toolbar !mb-0 !border-0 !p-0">
          <SearchField
            aria-label="Buscar en biblioteca"
            value={query}
            onChange={setQuery}
            className="fortino-toolbar-grow"
          >
            <SearchField.Group>
              <SearchField.Input placeholder={EX.searchMedia} />
            </SearchField.Group>
          </SearchField>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            isDisabled={uploading}
            onPress={() => fileRef.current?.click()}
          >
            {uploading ? <Spinner size="sm" /> : <Upload size={16} />}
            Subir
          </Button>
        </div>

        {loading ? (
          <p className="fortino-lead">Cargando biblioteca…</p>
        ) : assets.length === 0 ? (
          <div className="fortino-search-empty">
            <ImagePlus size={20} aria-hidden />
            <span>Sin imágenes. Sube la primera para asignarla a productos.</span>
          </div>
        ) : (
          <div className="fortino-media-grid">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="fortino-media-card"
                onClick={() => {
                  onSelect(asset);
                  onClose();
                }}
              >
                <img src={asset.url} alt={asset.name} className="fortino-media-card__img" />
                <span className="fortino-media-card__name">{asset.name}</span>
                {asset.tags.length > 0 && (
                  <span className="fortino-media-card__tags">{asset.tags.join(" · ")}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  );
}
