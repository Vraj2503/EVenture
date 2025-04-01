export type Scooter = {
    id: string;
    name: string;
    model: string;
    imageurl: string;
    priceperhour: number;
    maxspeed: string;
    location: string;
    mileage: string;
    support: string;
    owner: string;
    available: number;
    rating: number;
    created_at: string;
  };
  
  export type ScooterFormData = Omit<Scooter, 'id' | 'created_at'>;
  
  export const emptyScooterForm: ScooterFormData = {
    name: "",
    model: "",
    imageurl: "",
    priceperhour: 0,
    maxspeed: "",
    location: "",
    mileage: "",
    support: "",
    owner: "",
    available: 1,
    rating: 0
  };