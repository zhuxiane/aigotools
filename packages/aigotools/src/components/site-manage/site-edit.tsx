"use client";
import { useForm } from "react-hook-form";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";

import { InsertSite } from "@/db/schema";
import ArrowInput from "@/components/common/arrow-input";
import SingleImageUpload from "@/components/common/single-image-upload";
import { managerSearchCategories, saveSite } from "@/lib/actions";

import LinksInput from "./links-input";

export default function SiteEdit({
  site,
  onClose,
}: {
  site?: InsertSite;
  onClose: () => void;
}) {
  const { register, getValues, setValue, watch, reset, trigger, formState } =
    useForm<InsertSite>({
      defaultValues: site,
    });

  const t = useTranslations("siteEdit");

  const formValues = watch();

  const [isOpen, setIsOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reset(site);
    setIsOpen(!!site);
  }, [reset, site]);

  const onSubmit = useCallback(async () => {
    if (saving) {
      return;
    }
    try {
      if (!(await trigger("url"))) {
        return;
      }
      setSaving(true);
      const values = getValues();

      const site = await saveSite(values);

      if (!site) {
        toast.error(t("saveFailed"));
      } else {
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [saving, trigger, getValues, t, onClose]);

  const { data: categories = [] } = useQuery({
    queryKey: ["all-second-categories"],
    async queryFn() {
      const res = await managerSearchCategories({
        page: 1,
        size: 999,
        type: "second",
      });

      return res.categories;
    },
    initialData: [],
  });

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      onClose={() => {
        setIsOpen(false);
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          {site?.id ? t("updateTitle") : t("newTitle")}
        </ModalHeader>
        <ModalBody>
          <form className="grid grid-cols-2 gap-4 max-h-[65vh] pb-1 overflow-auto">
            <Input
              isRequired
              label={t("url")}
              size="sm"
              value={formValues.url}
              {...register("url", {
                required: true,
              })}
              color={formState.errors.url ? "danger" : "default"}
            />
            <Input
              label={t("name")}
              size="sm"
              value={formValues.name as unknown as any}
              {...register("name")}
            />
            <Input
              label={t("pricingType")}
              size="sm"
              value={formValues.pricingType as unknown as any}
              {...register("pricingType")}
            />
            <div className="flex items-center justify-between py-3 rounded-lg px-3 bg-primary-100">
              <label className="text-sm"> {t("featured")}</label>
              <Switch
                checked={formValues.featured as unknown as any}
                size="sm"
                {...register("featured")}
              />
            </div>
            <Input
              label={t("weight")}
              size="sm"
              value={formValues.weight as unknown as any}
              onValueChange={(value) => {
                setValue("weight", parseInt(value, 10));
              }}
            />
            <Select
              label={t("categories")}
              selectedKeys={formValues.categories as unknown as any}
              selectionMode="multiple"
              size="sm"
              onSelectionChange={(value) => {
                setValue(
                  "categories",
                  Array.from(value).map((item) => item.toString()),
                );
              }}
            >
              {categories.map((category) => {
                return (
                  <SelectItem key={category.id}>{category.name}</SelectItem>
                );
              })}
            </Select>
            <ArrowInput
              label={t("features")}
              value={formValues.features as unknown as any}
              onChange={(value) => {
                setValue("features", value);
              }}
            />
            <ArrowInput
              label={t("pricings")}
              value={formValues.pricings as unknown as any}
              onChange={(value) => {
                setValue("pricings", value);
              }}
            />
            <LinksInput
              value={formValues.links as unknown as any}
              onChange={(value) => {
                setValue("links", value);
              }}
            />
            <ArrowInput
              label={t("usecases")}
              value={formValues.usecases as unknown as any}
              onChange={(value) => {
                setValue("usecases", value);
              }}
            />
            <ArrowInput
              label={t("relatedSearchs")}
              value={formValues.relatedSearches as unknown as any}
              onChange={(value) => {
                setValue("relatedSearches", value);
              }}
            />
            <ArrowInput
              label={t("users")}
              value={formValues.users as unknown as any}
              onChange={(value) => {
                setValue("users", value);
              }}
            />
            <SingleImageUpload
              label={t("snapshot")}
              value={formValues.snapshot as unknown as any}
              onChange={(value) => {
                setValue("snapshot", value);
              }}
            />
            {/* <MultiImageUpload
              label={t("images")}
              value={formValues.images}
              onChange={(value) => {
                setValue("images", value);
              }}
            /> */}

            <Textarea
              label={t("description")}
              size="sm"
              value={formValues.description as unknown as any}
              {...register("description")}
              className="col-span-2"
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            isLoading={saving}
            size="sm"
            onClick={onSubmit}
          >
            {t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
