export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'admin' | 'user';
          status: 'active' | 'inactive' | 'banned';
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'admin' | 'user';
          status?: 'active' | 'inactive' | 'banned';
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'admin' | 'user';
          status?: 'active' | 'inactive' | 'banned';
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      genealogies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          privacy_level: 'public' | 'private' | 'family_only';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          privacy_level?: 'public' | 'private' | 'family_only';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          privacy_level?: 'public' | 'private' | 'family_only';
          created_at?: string;
          updated_at?: string;
        };
      };
      persons: {
        Row: {
          id: string;
          genealogy_id: string;
          name: string;
          gender: 'male' | 'female' | 'unknown';
          birth_date: string | null;
          death_date: string | null;
          birth_place: string | null;
          death_place: string | null;
          occupation: string | null;
          biography: string | null;
          photo_url: string | null;
          generation: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          genealogy_id: string;
          name: string;
          gender?: 'male' | 'female' | 'unknown';
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          death_place?: string | null;
          occupation?: string | null;
          biography?: string | null;
          photo_url?: string | null;
          generation?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          genealogy_id?: string;
          name?: string;
          gender?: 'male' | 'female' | 'unknown';
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          death_place?: string | null;
          occupation?: string | null;
          biography?: string | null;
          photo_url?: string | null;
          generation?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          genealogy_id: string;
          person1_id: string;
          person2_id: string;
          relationship_type: 'parent' | 'child' | 'spouse' | 'sibling';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          genealogy_id: string;
          person1_id: string;
          person2_id: string;
          relationship_type: 'parent' | 'child' | 'spouse' | 'sibling';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          genealogy_id?: string;
          person1_id?: string;
          person2_id?: string;
          relationship_type?: 'parent' | 'child' | 'spouse' | 'sibling';
          created_at?: string;
          updated_at?: string;
        };
      };
      person_events: {
        Row: {
          id: string;
          person_id: string;
          event_type: 'birth' | 'death' | 'marriage' | 'education' | 'career' | 'other';
          event_date: string | null;
          event_place: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          event_type: 'birth' | 'death' | 'marriage' | 'education' | 'career' | 'other';
          event_date?: string | null;
          event_place?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          event_type?: 'birth' | 'death' | 'marriage' | 'education' | 'career' | 'other';
          event_date?: string | null;
          event_place?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      geo_locations: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          address: string | null;
          type: 'city' | 'county' | 'province' | 'country' | 'landmark';
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          type: 'city' | 'county' | 'province' | 'country' | 'landmark';
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          type?: 'city' | 'county' | 'province' | 'country' | 'landmark';
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      historical_events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          event_date: string;
          location_id: string | null;
          event_type: 'political' | 'social' | 'economic' | 'cultural' | 'natural' | 'other';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          event_date: string;
          location_id?: string | null;
          event_type: 'political' | 'social' | 'economic' | 'cultural' | 'natural' | 'other';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          event_date?: string;
          location_id?: string | null;
          event_type?: 'political' | 'social' | 'economic' | 'cultural' | 'natural' | 'other';
          created_at?: string;
          updated_at?: string;
        };
      };
      genealogy_books: {
        Row: {
          id: string;
          genealogy_id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: 'pdf' | 'word' | 'image';
          file_size: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          genealogy_id: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type: 'pdf' | 'word' | 'image';
          file_size: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          genealogy_id?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: 'pdf' | 'word' | 'image';
          file_size?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ocr_tasks: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          result_text: string | null;
          confidence_score: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_url: string;
          file_name: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result_text?: string | null;
          confidence_score?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result_text?: string | null;
          confidence_score?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}