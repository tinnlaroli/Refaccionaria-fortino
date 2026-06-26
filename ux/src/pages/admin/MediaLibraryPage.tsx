import { useCallback, useEffect, useRef, useState } from "react";
import { Button, SearchField, Spinner } from "@heroui/react";
import { Upload } from "lucide-react";
import {
  fetchMediaAssets,
  fileToMediaUpload,
  updateMediaAsset,
  uploadMediaAsset,
  type MediaAsset,
} from "../../api/admin-media.js";
import { MediaPickerModal } from "../../components/media/MediaPickerModal.js";
import { AppModal } from "../../components/ui/AppModal.js";
import { EmptyState } from "../../components/EmptyState.js";
import { ErrorBanner } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { EX } from "../../config/fieldExamples.js";
import { FortinoTextField } from "../../components/ui/FortinoTextField.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";
import { required } from "../../lib/validation.js";

export function MediaLibraryPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPreview, setPickerPreview] = useState<MediaAsset | null>(null);

  const canUpload = hasPermission("media.upload");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMediaAssets(token, { q: query.trim() || undefined });
      setAssets(list);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar la biblioteca"));
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const handleUpload = async (file: File) => {
    if (!token || !canUpload) return;
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

  const openEdit = (asset: MediaAsset) => {
    setEditing(asset);
    setEditName(asset.name);
    setEditTags(asset.tags.join(", "));
    setEditError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditName("");
    setEditTags("");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!token || !editing) return;
    const nameErr = required(editName, "El nombre");
    if (nameErr) {
      setEditError(nameErr);
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const tags = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const updated = await updateMediaAsset(token, editing.id, {
        name: editName.trim(),
        tags,
      });
      success("Imagen actualizada");
      setAssets((prev) => prev.map((asset) => (asset.id === updated.id ? updated : asset)));
      closeEdit();
    } catch (err) {
      setEditError(getErrorMessage(err, "No se pudo actualizar"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fortino-admin-page">
      <PageToolbar>
        <PageToolbarGroup grow>
          <SearchField
            aria-label="Buscar en biblioteca"
            value={query}
            onChange={setQuery}
            className="fortino-page-toolbar__grow"
          >
            <SearchField.Group>
              <SearchField.Input placeholder="Nombre o etiqueta…" />
            </SearchField.Group>
          </SearchField>
        </PageToolbarGroup>
        <PageToolbarGroup>
          <Button variant="secondary" onPress={() => setPickerOpen(true)}>
            Abrir selector
          </Button>
          {canUpload && (
            <>
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
                variant="primary"
                isDisabled={uploading}
                onPress={() => fileRef.current?.click()}
              >
                {uploading ? <Spinner size="sm" /> : <Upload size={16} />}
                Subir imagen
              </Button>
            </>
          )}
        </PageToolbarGroup>
      </PageToolbar>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {pickerPreview && (
        <DataPanel title="Selección del selector" compact>
          <div className="flex items-center gap-3 p-4">
            <img
              src={pickerPreview.url}
              alt={pickerPreview.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div>
              <p className="m-0 text-sm font-semibold">{pickerPreview.name}</p>
              {pickerPreview.tags.length > 0 && (
                <p className="m-0 text-xs text-muted">{pickerPreview.tags.join(" · ")}</p>
              )}
            </div>
          </div>
        </DataPanel>
      )}

      {loading ? (
        <p className="fortino-lead px-1">Cargando biblioteca…</p>
      ) : assets.length === 0 ? (
        <EmptyState
          title="Sin imágenes"
          description={
            canUpload
              ? "Sube la primera imagen para usarla en productos y materiales."
              : "Aún no hay imágenes en la biblioteca."
          }
          actionLabel={canUpload ? "Subir imagen" : undefined}
          onAction={canUpload ? () => fileRef.current?.click() : undefined}
        />
      ) : (
        <DataPanel
          title="Biblioteca de medios"
          description={`${assets.length} imagen(es) disponible(s)`}
          compact
        >
          <div className="p-4 md:p-5">
            <div className="fortino-media-grid">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="fortino-media-card"
                  onClick={() => openEdit(asset)}
                >
                  <img src={asset.url} alt={asset.name} className="fortino-media-card__img" />
                  <span className="fortino-media-card__name">{asset.name}</span>
                  {asset.tags.length > 0 && (
                    <span className="fortino-media-card__tags">{asset.tags.join(" · ")}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </DataPanel>
      )}

      <AppModal
        open={Boolean(editing)}
        title="Editar imagen"
        subtitle="Nombre y etiquetas ayudan a encontrarla al asignar productos"
        onClose={closeEdit}
        onSubmit={handleSaveEdit}
        loading={saving}
      >
        {editing && (
          <div className="flex flex-col gap-5">
            <img
              src={editing.url}
              alt={editing.name}
              className="mx-auto max-h-48 rounded-xl object-contain"
            />
            <FortinoTextField
              id="media-name"
              label="Nombre descriptivo"
              placeholder={EX.mediaName}
              value={editName}
              onChange={setEditName}
              required
            />
            <FortinoTextField
              id="media-tags"
              label="Etiquetas de búsqueda"
              placeholder={EX.mediaTags}
              value={editTags}
              onChange={setEditTags}
              helperText="Separa con comas para filtrar en la biblioteca"
            />
            {editError && <p className="m-0 text-sm text-danger">{editError}</p>}
          </div>
        )}
      </AppModal>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          setPickerPreview(asset);
          success(`Seleccionaste: ${asset.name}`);
        }}
        title="Selector de imágenes"
      />
    </div>
  );
}
