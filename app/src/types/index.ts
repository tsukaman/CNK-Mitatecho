export interface Character {
  id: number;
  name: string;
  title: string;
  category: string;
  description: string;
}

export interface Q2Question {
  situation: string;
  choices: { text: string; type: string }[];
}

export interface CardScenario {
  name: string;
  color: string;
  colorCode: string;
  q1Situation: string;
  q1Choices: string[];
  q2: Record<number, Q2Question>;
  sctTemplate: string;
}

export interface SubmitRequest {
  card: number;
  q1: number;
  q2: number;
  free_text: string;
  x_account?: string;
  ogp_include?: boolean;
  q1_choice_text?: string;
  q2_choice_text?: string;
  q2_choice_type?: string;
  sct_template?: string;
}

export interface SubmitResponse {
  success: boolean;
  data: {
    id: string;
    character_id: number;
  };
}

export interface ResultData {
  id: string;
  card_id: number;
  q1: number;
  q2: number;
  free_text: string;
  character_id: number;
  poem: string | null;
  created_at: string;
}

export interface GalleryEntry {
  free_text: string;
  character_id: number;
  created_at: string;
}
