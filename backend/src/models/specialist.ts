export interface Specialist {
  id: number;              
  name: string;           
  specialty: string;      
  experience: number;     
  rating: number;         
  location: string;       
  price_per_hour: number; 
  created_at: Date;       
}


export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  location: string;
  price_per_hour: number;
}