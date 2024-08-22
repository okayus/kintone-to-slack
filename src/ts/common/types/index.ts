export type SavedConfig = {
  done: boolean;
  status: string;
  title: string;
  type: string;
};

export type Config = SavedConfig;

export type LabelAndFieldCode = {
  label: string;
  fieldCode: string;
};
