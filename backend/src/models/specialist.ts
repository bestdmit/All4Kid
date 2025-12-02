export interface Specialist {
  id: number;              
  name: string;           
  specialty: string;      
  category: string;        
  description: string;     
  experience: number;     
  rating: number;         
  location: string;       
  price_per_hour: number; 
  avatar_url: string;    
  created_at: Date;       
}

export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  category: string;
  description: string;
  experience: number;
  rating: number;
  location: string;
  price_per_hour: number;
  avatar_url: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_url: string;
}