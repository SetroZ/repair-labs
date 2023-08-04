import { zodResolver } from "@hookform/resolvers/zod";
import { Brand, ItemType, RepairRequest } from "@prisma/client";
import { SubmitHandler, useForm } from "react-hook-form";

import Button from "@/components/Button";
import DropDown from "@/components/FormFields/field-dropdown";
import FieldInput from "@/components/FormFields/field-input";
import FieldRadio from "@/components/FormFields/field-radio";
import FieldTextArea from "@/components/FormFields/field-text-area";
import { repairRequestPatchSchema } from "@/schema/repair-request";
import type { GeneralRepairAttempt } from "@/types";

export default function PrepopulatedRepairAttemptForm({
  props,
  itemBrands,
  itemTypes,
  onSubmit
}: {
  props: RepairRequest;
  itemBrands?: Brand[];
  itemTypes?: ItemType[];
  onSubmit: SubmitHandler<GeneralRepairAttempt>;
}) {
  let status;
  switch (props.status) {
    case "REPAIRED":
      status = "true";
      break;
    case "FAILED":
    case "PENDING":
      status = "false";
  }

  let isSparePartsNeeded;
  props.spareParts == ""
    ? (isSparePartsNeeded = "false")
    : (isSparePartsNeeded = "true");

  let actualItemBrands;
  itemBrands
    ? (actualItemBrands = itemBrands.map((type) => ({
        id: type.name,
        text: type.name
      })))
    : (actualItemBrands = [
        { id: 0, text: "Alienware" },
        { id: 1, text: "Giant Bicycles" },
        { id: 2, text: "Seiko" }
      ]);

  let actualItemTypes;
  itemTypes
    ? (actualItemTypes = itemTypes.map((type) => ({
        id: type.name,
        text: type.name
      })))
    : (actualItemTypes = [
        { id: 0, text: "Bike" },
        { id: 1, text: "Clock" },
        { id: 2, text: "Computer" }
      ]);

  const { watch, control, handleSubmit } = useForm<GeneralRepairAttempt>({
    resolver: zodResolver(repairRequestPatchSchema),
    defaultValues: {
      id: props.id,
      item: props.itemType,
      itemBrand: props.itemBrand,
      itemMaterial: props.itemMaterial,
      hoursWorked: Number(props.hoursWorked),
      isRepaired: status,
      isSparePartsNeeded: isSparePartsNeeded,
      spareParts: props.spareParts,
      repairComment: props.comment
    }
  });

  const watchIsSparePartsNeeded = watch("isSparePartsNeeded");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ID, Item */}
      <div className="m-5 flex flex-wrap gap-2 max-[415px]:m-2">
        <DropDown
          name="item"
          control={control}
          rules={{ required: true }}
          options={actualItemTypes}
        />

        {/* Brand, Material */}
        <DropDown
          name="itemBrand"
          label="Brand"
          control={control}
          rules={{ required: true }}
          options={actualItemBrands}
        />
        <FieldInput
          name="itemMaterial"
          label="Material"
          placeholder="e.g. Wood, Metal, Plastic"
          control={control}
          rules={{ required: true }}
        />

        {/* Time it took, Repaired? */}
        <FieldInput
          name="hoursWorked"
          label="Time it took"
          placeholder="Time in hours, e.g. 1.5"
          control={control}
          rules={{ required: true }}
        />

        {/* Spare parts needed?, Part(s) needed */}
        <div className="flex w-full flex-row gap-8 max-[415px]:gap-3">
          <FieldRadio
            name="isRepaired"
            control={control}
            label="Repaired?"
            rules={{ required: true }}
          />

          <FieldRadio
            name="isSparePartsNeeded"
            control={control}
            label="Spare parts needed?"
            rules={{ required: true }}
          />
        </div>

        {watchIsSparePartsNeeded === "true" && (
          <FieldInput
            name="spareParts"
            label="Parts needed"
            placeholder="e.g. 2x screws"
            control={control}
            rules={{
              required: watchIsSparePartsNeeded === "true" ? true : false
            }}
          />
        )}

        {/* Job Description */}
        <FieldTextArea
          name="repairComment"
          label="Job Description"
          placeholder="Describe the repair job in detail"
          control={control}
          rules={{ required: true }}
        />
      </div>

      {/* Submit */}
      <div className="my-5 flex flex-row">
        <Button
          onClick={handleSubmit(onSubmit)}
          height="h-9"
          width="w-1/3"
          textSize="text-base"
        >
          Submit
        </Button>
      </div>
    </form>
  );
}