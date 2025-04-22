type Role = "admin" | "user";

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  age: number;
  role: string;
}

export interface Owner {
  id: number;
  email: string;
  password: string;
  name: string;
  age: number;
}

export interface HardwareComponent {
  id : number;
  name: string;
  details: string;
  price: number;
}

export interface ImageUrl {
  id : number;
  url: string;
  details: string;
}

export interface Comment {
  comment_id: number;
  setup_id: number;
  user_id: number;
  content: string;
}

export interface Setup {
  setup_id: number;
  owner: Owner;
  hardware_components: Array<HardwareComponent>;
  image_urls: Array<ImageUrl>;
  details: string;
  last_updated: string;
  comments: Array<Comment>; // Updated to use Comment type
}

export interface SetupInput {
  setupId: number;
  ownerId: number;
  hardwareComponents: Array<string>;
  imageUrls: Array<string>;
  details: string;
  lastUpdated: Date;
}

export interface Comment {
  setup_id: number;
  user_id: number;
  content: string;
}

