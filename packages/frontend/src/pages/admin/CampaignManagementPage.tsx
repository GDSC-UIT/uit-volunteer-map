import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
} from "@/hooks/useCampaigns";

type CampaignForm = {
  campaignName: string;
  startDate: string;
  endDate: string;
  description: string;
};

const emptyForm: CampaignForm = {
  campaignName: "",
  startDate: "",
  endDate: "",
  description: "",
};

export default function CampaignManagementPage() {
  const { data: campaigns = [], isLoading, error } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm);

  const activeCampaign = useMemo(
    () =>
      campaigns.find((campaign) => campaign.campaignId === activeCampaignId) ??
      null,
    [activeCampaignId, campaigns],
  );

  useEffect(() => {
    if (!isCreating && !activeCampaignId && campaigns.length > 0) {
      setActiveCampaignId(campaigns[0].campaignId);
    }
  }, [activeCampaignId, campaigns, isCreating]);

  useEffect(() => {
    if (!isCreating && activeCampaign) {
      setForm({
        campaignName: activeCampaign.campaignName,
        startDate: activeCampaign.startDate,
        endDate: activeCampaign.endDate,
        description: activeCampaign.description ?? "",
      });
    }
  }, [activeCampaign, isCreating]);

  const isSaving = createCampaign.isPending || updateCampaign.isPending;
  const mutationError =
    createCampaign.error?.message ||
    updateCampaign.error?.message ||
    deleteCampaign.error?.message;

  const handleCreateMode = () => {
    setIsCreating(true);
    setActiveCampaignId(null);
    setForm(emptyForm);
  };

  const handleSelectCampaign = (campaignId: number) => {
    setIsCreating(false);
    setActiveCampaignId(campaignId);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      campaignName: form.campaignName.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim() || null,
    };

    if (isCreating) {
      const created = await createCampaign.mutateAsync(payload);
      setIsCreating(false);
      setActiveCampaignId(created.campaignId);
      return;
    }

    if (activeCampaignId) {
      await updateCampaign.mutateAsync({
        id: activeCampaignId,
        payload,
      });
    }
  };

  const handleDelete = async () => {
    if (!activeCampaignId) return;

    await deleteCampaign.mutateAsync(activeCampaignId);
    setActiveCampaignId(null);
    setIsCreating(false);
    setForm(emptyForm);
  };

  return (
    <div className="flex flex-col text-black">
      <h1 className="text-3xl font-bold mb-6">QUAN LY CHIEN DICH</h1>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6 overflow-x-auto">
          {campaigns.map((campaign) => {
            const isActive =
              !isCreating && campaign.campaignId === activeCampaignId;

            return (
              <button
                key={campaign.campaignId}
                onClick={() => handleSelectCampaign(campaign.campaignId)}
                className={`pb-2 text-sm whitespace-nowrap transition ${
                  isActive
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {campaign.campaignName}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCreateMode}
          className="flex items-center gap-2 border-2 border-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-50 transition"
        >
          <PlusIcon className="h-4 w-4" />
          Them chien dich
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Dang tai...</p>}

      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Khong tai duoc du lieu"}
        </p>
      )}

      {!isLoading && campaigns.length === 0 && !isCreating && (
        <p className="text-sm text-gray-500">Chua co chien dich nao.</p>
      )}

      {(activeCampaign || isCreating) && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div>
            <label className="font-semibold mb-2 block" htmlFor="campaignName">
              Ten chien dich
            </label>
            <input
              id="campaignName"
              value={form.campaignName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  campaignName: event.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold mb-2 block" htmlFor="startDate">
                Ngay bat dau
              </label>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="font-semibold mb-2 block" htmlFor="endDate">
                Ngay ket thuc
              </label>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold mb-2 block" htmlFor="description">
              Mo ta chung
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full min-h-32 border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {mutationError && (
            <p className="text-sm text-red-600">{mutationError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
              {isSaving ? "Dang luu..." : "Luu"}
            </button>

            {!isCreating && activeCampaignId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteCampaign.isPending}
                className="flex items-center gap-2 border border-red-500 text-red-600 px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {deleteCampaign.isPending ? "Dang xoa..." : "Xoa"}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
