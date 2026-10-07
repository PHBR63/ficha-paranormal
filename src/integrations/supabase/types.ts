export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string
          target_user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          target_user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          target_user_id?: string
        }
        Relationships: []
      }
      campaign_asset_folders: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_asset_folders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_asset_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "campaign_asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          campaign_id: string
          category: string
          created_at: string
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          name: string
          tags: string[]
          uploaded_by: string
        }
        Insert: {
          campaign_id: string
          category?: string
          created_at?: string
          file_size?: number
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          name: string
          tags?: string[]
          uploaded_by: string
        }
        Update: {
          campaign_id?: string
          category?: string
          created_at?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          name?: string
          tags?: string[]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_audio: {
        Row: {
          audio_type: string
          audio_url: string
          campaign_id: string
          created_at: string
          created_by: string
          duration_seconds: number | null
          id: string
          is_looping: boolean | null
          name: string
          tags: string[] | null
          updated_at: string
          volume: number | null
        }
        Insert: {
          audio_type?: string
          audio_url: string
          campaign_id: string
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          id?: string
          is_looping?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string
          volume?: number | null
        }
        Update: {
          audio_type?: string
          audio_url?: string
          campaign_id?: string
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          id?: string
          is_looping?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_audio_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_audio_state: {
        Row: {
          campaign_id: string
          current_scene_id: string | null
          id: string
          is_muted: boolean | null
          master_volume: number | null
          playing_tracks: Json | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          campaign_id: string
          current_scene_id?: string | null
          id?: string
          is_muted?: boolean | null
          master_volume?: number | null
          playing_tracks?: Json | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          campaign_id?: string
          current_scene_id?: string | null
          id?: string
          is_muted?: boolean | null
          master_volume?: number | null
          playing_tracks?: Json | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_audio_state_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_audio_state_current_scene_id_fkey"
            columns: ["current_scene_id"]
            isOneToOne: false
            referencedRelation: "campaign_sound_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_combat_state_v2: {
        Row: {
          campaign_id: string
          last_scene_ended_at: string | null
          revision: number
          scene_number: number
          state: Json
          updated_at: string
        }
        Insert: {
          campaign_id: string
          last_scene_ended_at?: string | null
          revision?: number
          scene_number?: number
          state?: Json
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          last_scene_ended_at?: string | null
          revision?: number
          scene_number?: number
          state?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_combat_state_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_handouts: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          created_by: string
          handout_type: string
          id: string
          image_url: string | null
          revealed_at: string | null
          shared_with: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          created_by: string
          handout_type?: string
          id?: string
          image_url?: string | null
          revealed_at?: string | null
          shared_with?: string[] | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          handout_type?: string
          id?: string
          image_url?: string | null
          revealed_at?: string | null
          shared_with?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_handouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_invites: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number | null
          uses: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          max_uses?: number | null
          uses?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          max_uses?: number | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_invites_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_invites_v2: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number | null
          uses: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          max_uses?: number | null
          uses?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          max_uses?: number | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_invites_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_maps: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          fog_of_war: Json | null
          grid_color: string | null
          grid_size: number
          grid_type: string
          grid_visible: boolean | null
          height_cells: number | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          updated_at: string
          width_cells: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          fog_of_war?: Json | null
          grid_color?: string | null
          grid_size?: number
          grid_type?: string
          grid_visible?: boolean | null
          height_cells?: number | null
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          updated_at?: string
          width_cells?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          fog_of_war?: Json | null
          grid_color?: string | null
          grid_size?: number
          grid_type?: string
          grid_visible?: boolean | null
          height_cells?: number | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          width_cells?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_maps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_maps_v2: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          fog_of_war: Json | null
          grid_color: string | null
          grid_size: number
          grid_type: string
          grid_visible: boolean | null
          height_cells: number | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          updated_at: string
          width_cells: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          fog_of_war?: Json | null
          grid_color?: string | null
          grid_size?: number
          grid_type?: string
          grid_visible?: boolean | null
          height_cells?: number | null
          id?: string
          image_url?: string
          is_active?: boolean
          name: string
          updated_at?: string
          width_cells?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          fog_of_war?: Json | null
          grid_color?: string | null
          grid_size?: number
          grid_type?: string
          grid_visible?: boolean | null
          height_cells?: number | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          width_cells?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_maps_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          active_bonuses: Json | null
          bonuses_updated_at: string | null
          campaign_id: string
          character_id: string | null
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          active_bonuses?: Json | null
          bonuses_updated_at?: string | null
          campaign_id: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          active_bonuses?: Json | null
          bonuses_updated_at?: string | null
          campaign_id?: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members_v2: {
        Row: {
          active_bonuses: Json | null
          bonuses_updated_at: string | null
          campaign_id: string
          character_id: string | null
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          active_bonuses?: Json | null
          bonuses_updated_at?: string | null
          campaign_id: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          active_bonuses?: Json | null
          bonuses_updated_at?: string | null
          campaign_id?: string
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          character_id: string | null
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          recipient_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages_v2: {
        Row: {
          campaign_id: string
          character_id: string | null
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          recipient_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          recipient_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_notes: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          is_private: boolean
          note_type: string
          session_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          note_type?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          note_type?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "campaign_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_npcs: {
        Row: {
          abilities: Json | null
          attacks: Json | null
          attributes: Json | null
          campaign_id: string
          category: string
          created_at: string
          created_by: string
          defense: number
          description: string | null
          hp_current: number
          hp_max: number
          id: string
          image_url: string | null
          immunities: Json | null
          is_active: boolean | null
          movement: number | null
          name: string
          notes: string | null
          pe_current: number | null
          pe_max: number | null
          resistances: Json | null
          updated_at: string
        }
        Insert: {
          abilities?: Json | null
          attacks?: Json | null
          attributes?: Json | null
          campaign_id: string
          category?: string
          created_at?: string
          created_by: string
          defense?: number
          description?: string | null
          hp_current?: number
          hp_max?: number
          id?: string
          image_url?: string | null
          immunities?: Json | null
          is_active?: boolean | null
          movement?: number | null
          name: string
          notes?: string | null
          pe_current?: number | null
          pe_max?: number | null
          resistances?: Json | null
          updated_at?: string
        }
        Update: {
          abilities?: Json | null
          attacks?: Json | null
          attributes?: Json | null
          campaign_id?: string
          category?: string
          created_at?: string
          created_by?: string
          defense?: number
          description?: string | null
          hp_current?: number
          hp_max?: number
          id?: string
          image_url?: string | null
          immunities?: Json | null
          is_active?: boolean | null
          movement?: number | null
          name?: string
          notes?: string | null
          pe_current?: number | null
          pe_max?: number | null
          resistances?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_ritual_casts: {
        Row: {
          campaign_id: string
          character_id: string
          created_at: string
          enhancements: string[] | null
          id: string
          pe_after: number
          pe_before: number
          pe_cost: number
          ritual_circle: number
          ritual_element: string
          ritual_id: string
          ritual_name: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id: string
          created_at?: string
          enhancements?: string[] | null
          id?: string
          pe_after: number
          pe_before: number
          pe_cost: number
          ritual_circle: number
          ritual_element: string
          ritual_id: string
          ritual_name: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string
          created_at?: string
          enhancements?: string[] | null
          id?: string
          pe_after?: number
          pe_before?: number
          pe_cost?: number
          ritual_circle?: number
          ritual_element?: string
          ritual_id?: string
          ritual_name?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ritual_casts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ritual_casts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ritual_casts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "campaign_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_scene_events_v2: {
        Row: {
          author_id: string
          campaign_id: string
          created_at: string
          ended_combat: boolean
          expected_revision: number
          expired_effects_count: number | null
          operation_id: string
          scene_number: number
        }
        Insert: {
          author_id: string
          campaign_id: string
          created_at?: string
          ended_combat: boolean
          expected_revision: number
          expired_effects_count?: number | null
          operation_id: string
          scene_number: number
        }
        Update: {
          author_id?: string
          campaign_id?: string
          created_at?: string
          ended_combat?: boolean
          expected_revision?: number
          expired_effects_count?: number | null
          operation_id?: string
          scene_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_scene_events_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_scene_notes: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          created_by: string
          id: string
          is_private: boolean
          note_type: string
          session_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_private?: boolean
          note_type?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_private?: boolean
          note_type?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_scene_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_scene_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "campaign_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sessions: {
        Row: {
          campaign_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: Json | null
          scheduled_at: string | null
          session_number: number
          started_at: string | null
          status: string
          summary: string | null
          title: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: Json | null
          scheduled_at?: string | null
          session_number: number
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: Json | null
          scheduled_at?: string | null
          session_number?: number
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sessions_v2: {
        Row: {
          campaign_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: Json | null
          scheduled_at: string | null
          session_number: number
          started_at: string | null
          status: string
          summary: string | null
          title: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: Json | null
          scheduled_at?: string | null
          session_number: number
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: Json | null
          scheduled_at?: string | null
          session_number?: number
          started_at?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sessions_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sound_scenes: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          master_volume: number | null
          name: string
          tracks: Json
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          master_volume?: number | null
          name: string
          tracks?: Json
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          master_volume?: number | null
          name?: string
          tracks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sound_scenes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_timeline_events: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          importance: number
          metadata: Json | null
          session_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          importance?: number
          metadata?: Json | null
          session_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          importance?: number
          metadata?: Json | null
          session_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_timeline_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_timeline_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "campaign_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          cover_image_url: string | null
          created_at: string
          current_session: number
          description: string | null
          id: string
          master_id: string
          name: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          current_session?: number
          description?: string | null
          id?: string
          master_id: string
          name: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          current_session?: number
          description?: string | null
          id?: string
          master_id?: string
          name?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns_v2: {
        Row: {
          cover_image_url: string | null
          created_at: string
          current_session: number
          description: string | null
          id: string
          master_id: string
          name: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          current_session?: number
          description?: string | null
          id?: string
          master_id: string
          name: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          current_session?: number
          description?: string | null
          id?: string
          master_id?: string
          name?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_active_conditions: {
        Row: {
          applied_at_round: number | null
          applied_at_turn: number | null
          campaign_id: string | null
          can_be_removed: boolean | null
          character_id: string
          color: string | null
          condition_id: string
          condition_name: string
          condition_type: string
          created_at: string
          decrements_at: string | null
          description: string | null
          duration_remaining: number | null
          duration_total: number | null
          duration_type: string
          icon: string | null
          id: string
          max_stacks: number | null
          mechanical_effect: string | null
          session_id: string | null
          source_name: string | null
          source_type: string | null
          stacks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at_round?: number | null
          applied_at_turn?: number | null
          campaign_id?: string | null
          can_be_removed?: boolean | null
          character_id: string
          color?: string | null
          condition_id: string
          condition_name: string
          condition_type?: string
          created_at?: string
          decrements_at?: string | null
          description?: string | null
          duration_remaining?: number | null
          duration_total?: number | null
          duration_type?: string
          icon?: string | null
          id?: string
          max_stacks?: number | null
          mechanical_effect?: string | null
          session_id?: string | null
          source_name?: string | null
          source_type?: string | null
          stacks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at_round?: number | null
          applied_at_turn?: number | null
          campaign_id?: string | null
          can_be_removed?: boolean | null
          character_id?: string
          color?: string | null
          condition_id?: string
          condition_name?: string
          condition_type?: string
          created_at?: string
          decrements_at?: string | null
          description?: string | null
          duration_remaining?: number | null
          duration_total?: number | null
          duration_type?: string
          icon?: string | null
          id?: string
          max_stacks?: number | null
          mechanical_effect?: string | null
          session_id?: string | null
          source_name?: string | null
          source_type?: string | null
          stacks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_active_conditions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_active_conditions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_active_conditions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "campaign_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_activity_events: {
        Row: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        Insert: {
          author_id: string
          campaign_id?: string | null
          campaign_version?: string | null
          category: string
          character_id: string
          created_at?: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        Update: {
          author_id?: string
          campaign_id?: string | null
          campaign_version?: string | null
          category?: string
          character_id?: string
          created_at?: string
          id?: string
          operation_id?: string
          payload?: Json
          request_hash?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_activity_events_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_activity_visibility: {
        Row: {
          character_id: string
          hidden_before: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          hidden_before?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          hidden_before?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_activity_visibility_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_change_history: {
        Row: {
          change_type: string
          character_id: string
          created_at: string
          description: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          character_id: string
          created_at?: string
          description?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          character_id?: string
          created_at?: string
          description?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_change_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_power_choices: {
        Row: {
          character_id: string
          choice_type: string
          created_at: string | null
          id: string
          nex: number
          resolution: Json | null
          resolved_at: string | null
          sanity_delta: number | null
          status: string
          user_id: string
        }
        Insert: {
          character_id: string
          choice_type: string
          created_at?: string | null
          id?: string
          nex: number
          resolution?: Json | null
          resolved_at?: string | null
          sanity_delta?: number | null
          status?: string
          user_id: string
        }
        Update: {
          character_id?: string
          choice_type?: string
          created_at?: string | null
          id?: string
          nex?: number
          resolution?: Json | null
          resolved_at?: string | null
          sanity_delta?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_power_choices_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_removed_powers: {
        Row: {
          character_id: string
          id: string
          is_restored: boolean
          power_data: Json
          power_description: string | null
          power_element: string | null
          power_id: string
          power_name: string
          removal_reason: string | null
          removed_at: string
          restored_at: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          id?: string
          is_restored?: boolean
          power_data: Json
          power_description?: string | null
          power_element?: string | null
          power_id: string
          power_name: string
          removal_reason?: string | null
          removed_at?: string
          restored_at?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          id?: string
          is_restored?: boolean
          power_data?: Json
          power_description?: string | null
          power_element?: string | null
          power_id?: string
          power_name?: string
          removal_reason?: string | null
          removed_at?: string
          restored_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_removed_powers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_scene_casts_v2: {
        Row: {
          campaign_id: string
          cast_event_id: string
          scene_number: number
        }
        Insert: {
          campaign_id: string
          cast_event_id: string
          scene_number: number
        }
        Update: {
          campaign_id?: string
          cast_event_id?: string
          scene_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_scene_casts_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_scene_casts_v2_cast_event_id_fkey"
            columns: ["cast_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_scene_effects_v2: {
        Row: {
          application_id: string
          campaign_id: string
          character_id: string
          effect_id: string
          field: string
          scene_number: number
        }
        Insert: {
          application_id: string
          campaign_id: string
          character_id: string
          effect_id: string
          field: string
          scene_number: number
        }
        Update: {
          application_id?: string
          campaign_id?: string
          character_id?: string
          effect_id?: string
          field?: string
          scene_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_scene_effects_v2_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_scene_effects_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_scene_effects_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_sustained_rituals: {
        Row: {
          character_id: string
          circle: number
          created_at: string | null
          element: string
          id: string
          is_concentrating: boolean | null
          pe_spent_total: number | null
          ritual_id: string
          ritual_name: string
          selected_enhancements: string[] | null
          started_at: string | null
          sustain_config: Json | null
          turns_active: number | null
          user_id: string
        }
        Insert: {
          character_id: string
          circle?: number
          created_at?: string | null
          element: string
          id?: string
          is_concentrating?: boolean | null
          pe_spent_total?: number | null
          ritual_id: string
          ritual_name: string
          selected_enhancements?: string[] | null
          started_at?: string | null
          sustain_config?: Json | null
          turns_active?: number | null
          user_id: string
        }
        Update: {
          character_id?: string
          circle?: number
          created_at?: string | null
          element?: string
          id?: string
          is_concentrating?: boolean | null
          pe_spent_total?: number | null
          ritual_id?: string
          ritual_name?: string
          selected_enhancements?: string[] | null
          started_at?: string | null
          sustain_config?: Json | null
          turns_active?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_sustained_rituals_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_templates: {
        Row: {
          author_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          difficulty_level: string | null
          id: string
          is_official: boolean
          is_public: boolean
          max_nex: number
          min_nex: number
          name: string
          rating: number | null
          rating_count: number
          tags: string[] | null
          template_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          author_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_official?: boolean
          is_public?: boolean
          max_nex?: number
          min_nex?: number
          name: string
          rating?: number | null
          rating_count?: number
          tags?: string[] | null
          template_data: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          author_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_official?: boolean
          is_public?: boolean
          max_nex?: number
          min_nex?: number
          name?: string
          rating?: number | null
          rating_count?: number
          tags?: string[] | null
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      characters: {
        Row: {
          abilities: Json
          activated_effects: Json | null
          active_buffs: Json | null
          active_conditional_bonuses: string[] | null
          affinity_active: boolean | null
          age: number | null
          agility: number
          appearance: string | null
          background: string | null
          class: string
          class_power_choices: Json | null
          class_track: string | null
          concept: string | null
          conditions: Json
          created_at: string
          defense: number
          elemental_affinity: string | null
          gender: string | null
          general_powers: Json | null
          hp_current: number
          hp_max: number
          id: string
          intellect: number
          inventory: Json
          movement: number
          name: string
          nex: number
          notes: string | null
          origin: string
          paranormal_powers: Json | null
          patent: string
          pe_current: number
          pe_max: number
          personality: string | null
          photo_url: string | null
          player_name: string | null
          powers: Json
          presence: number
          proficiencies: Json
          rituals: Json
          san_current: number
          san_max: number
          skill_training_choices: Json | null
          skills: Json
          strength: number
          training_grade_choices: Json | null
          updated_at: string
          user_id: string
          versatility_track: Json | null
          vigor: number
        }
        Insert: {
          abilities?: Json
          activated_effects?: Json | null
          active_buffs?: Json | null
          active_conditional_bonuses?: string[] | null
          affinity_active?: boolean | null
          age?: number | null
          agility?: number
          appearance?: string | null
          background?: string | null
          class: string
          class_power_choices?: Json | null
          class_track?: string | null
          concept?: string | null
          conditions?: Json
          created_at?: string
          defense?: number
          elemental_affinity?: string | null
          gender?: string | null
          general_powers?: Json | null
          hp_current?: number
          hp_max?: number
          id?: string
          intellect?: number
          inventory?: Json
          movement?: number
          name: string
          nex?: number
          notes?: string | null
          origin: string
          paranormal_powers?: Json | null
          patent?: string
          pe_current?: number
          pe_max?: number
          personality?: string | null
          photo_url?: string | null
          player_name?: string | null
          powers?: Json
          presence?: number
          proficiencies?: Json
          rituals?: Json
          san_current?: number
          san_max?: number
          skill_training_choices?: Json | null
          skills?: Json
          strength?: number
          training_grade_choices?: Json | null
          updated_at?: string
          user_id: string
          versatility_track?: Json | null
          vigor?: number
        }
        Update: {
          abilities?: Json
          activated_effects?: Json | null
          active_buffs?: Json | null
          active_conditional_bonuses?: string[] | null
          affinity_active?: boolean | null
          age?: number | null
          agility?: number
          appearance?: string | null
          background?: string | null
          class?: string
          class_power_choices?: Json | null
          class_track?: string | null
          concept?: string | null
          conditions?: Json
          created_at?: string
          defense?: number
          elemental_affinity?: string | null
          gender?: string | null
          general_powers?: Json | null
          hp_current?: number
          hp_max?: number
          id?: string
          intellect?: number
          inventory?: Json
          movement?: number
          name?: string
          nex?: number
          notes?: string | null
          origin?: string
          paranormal_powers?: Json | null
          patent?: string
          pe_current?: number
          pe_max?: number
          personality?: string | null
          photo_url?: string | null
          player_name?: string | null
          powers?: Json
          presence?: number
          proficiencies?: Json
          rituals?: Json
          san_current?: number
          san_max?: number
          skill_training_choices?: Json | null
          skills?: Json
          strength?: number
          training_grade_choices?: Json | null
          updated_at?: string
          user_id?: string
          versatility_track?: Json | null
          vigor?: number
        }
        Relationships: []
      }
      map_area_effects: {
        Row: {
          angle: number | null
          border_color: string | null
          color: string
          created_at: string
          created_by: string
          element: string | null
          id: string
          label: string | null
          line_length: number | null
          map_id: string
          opacity: number
          origin_x: number
          origin_y: number
          radius: number | null
          rotation: number | null
          shape_type: string
          side_length: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          angle?: number | null
          border_color?: string | null
          color?: string
          created_at?: string
          created_by: string
          element?: string | null
          id?: string
          label?: string | null
          line_length?: number | null
          map_id: string
          opacity?: number
          origin_x?: number
          origin_y?: number
          radius?: number | null
          rotation?: number | null
          shape_type?: string
          side_length?: number | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          angle?: number | null
          border_color?: string | null
          color?: string
          created_at?: string
          created_by?: string
          element?: string | null
          id?: string
          label?: string | null
          line_length?: number | null
          map_id?: string
          opacity?: number
          origin_x?: number
          origin_y?: number
          radius?: number | null
          rotation?: number | null
          shape_type?: string
          side_length?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_area_effects_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_drawings: {
        Row: {
          color: string
          created_at: string
          created_by: string
          id: string
          map_id: string
          opacity: number
          points: Json
          stroke_width: number
          tool: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          id?: string
          map_id: string
          opacity?: number
          points?: Json
          stroke_width?: number
          tool?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          id?: string
          map_id?: string
          opacity?: number
          points?: Json
          stroke_width?: number
          tool?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_drawings_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_pins: {
        Row: {
          color: string
          content: string | null
          created_at: string
          created_by: string
          handout_id: string | null
          icon: string
          id: string
          map_id: string
          pin_type: string
          title: string
          updated_at: string
          visibility: string
          x: number
          y: number
        }
        Insert: {
          color?: string
          content?: string | null
          created_at?: string
          created_by: string
          handout_id?: string | null
          icon?: string
          id?: string
          map_id: string
          pin_type?: string
          title?: string
          updated_at?: string
          visibility?: string
          x?: number
          y?: number
        }
        Update: {
          color?: string
          content?: string | null
          created_at?: string
          created_by?: string
          handout_id?: string | null
          icon?: string
          id?: string
          map_id?: string
          pin_type?: string
          title?: string
          updated_at?: string
          visibility?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_pins_handout_id_fkey"
            columns: ["handout_id"]
            isOneToOne: false
            referencedRelation: "campaign_handouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_pins_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_texts: {
        Row: {
          color: string
          created_at: string
          created_by: string
          font_size: number
          id: string
          map_id: string
          rotation: number
          text: string
          x: number
          y: number
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          font_size?: number
          id?: string
          map_id: string
          rotation?: number
          text?: string
          x?: number
          y?: number
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          font_size?: number
          id?: string
          map_id?: string
          rotation?: number
          text?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_texts_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_tokens: {
        Row: {
          character_id: string | null
          conditions: Json | null
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          layer: string
          light_color: string | null
          light_radius: number | null
          locked: boolean | null
          map_id: string
          name: string
          notes: string | null
          rotation: number | null
          size: number
          token_type: string
          updated_at: string
          visible_to: string[] | null
          x: number
          y: number
        }
        Insert: {
          character_id?: string | null
          conditions?: Json | null
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          layer?: string
          light_color?: string | null
          light_radius?: number | null
          locked?: boolean | null
          map_id: string
          name: string
          notes?: string | null
          rotation?: number | null
          size?: number
          token_type?: string
          updated_at?: string
          visible_to?: string[] | null
          x?: number
          y?: number
        }
        Update: {
          character_id?: string | null
          conditions?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          layer?: string
          light_color?: string | null
          light_radius?: number | null
          locked?: boolean | null
          map_id?: string
          name?: string
          notes?: string | null
          rotation?: number | null
          size?: number
          token_type?: string
          updated_at?: string
          visible_to?: string[] | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_tokens_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_tokens_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_tokens_v2: {
        Row: {
          character_id: string | null
          conditions: Json | null
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          layer: string
          light_color: string | null
          light_radius: number | null
          locked: boolean | null
          map_id: string
          name: string
          notes: string | null
          rotation: number | null
          size: number
          token_type: string
          updated_at: string
          visible_to: string[] | null
          x: number
          y: number
        }
        Insert: {
          character_id?: string | null
          conditions?: Json | null
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          layer?: string
          light_color?: string | null
          light_radius?: number | null
          locked?: boolean | null
          map_id: string
          name: string
          notes?: string | null
          rotation?: number | null
          size?: number
          token_type?: string
          updated_at?: string
          visible_to?: string[] | null
          x?: number
          y?: number
        }
        Update: {
          character_id?: string | null
          conditions?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          layer?: string
          light_color?: string | null
          light_radius?: number | null
          locked?: boolean | null
          map_id?: string
          name?: string
          notes?: string | null
          rotation?: number | null
          size?: number
          token_type?: string
          updated_at?: string
          visible_to?: string[] | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_tokens_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_tokens_v2_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "campaign_maps_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          developer_mode: boolean
          display_name: string | null
          id: string
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          developer_mode?: boolean
          display_name?: string | null
          id?: string
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          developer_mode?: boolean
          display_name?: string | null
          id?: string
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sustained_ritual_origins: {
        Row: {
          cast_event_id: string
          caster_character_id: string
          sustained_id: string
        }
        Insert: {
          cast_event_id: string
          caster_character_id: string
          sustained_id: string
        }
        Update: {
          cast_event_id?: string
          caster_character_id?: string
          sustained_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustained_ritual_origins_cast_event_id_fkey"
            columns: ["cast_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustained_ritual_origins_caster_character_id_fkey"
            columns: ["caster_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustained_ritual_origins_sustained_id_fkey"
            columns: ["sustained_id"]
            isOneToOne: true
            referencedRelation: "character_sustained_rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      template_applications: {
        Row: {
          applied_at: string
          character_id: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          character_id?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          applied_at?: string
          character_id?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_applications_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_applications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "character_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          template_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          template_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "character_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activity_json_integer: {
        Args: { p_max: number; p_min: number; p_value: Json }
        Returns: boolean
      }
      apply_character_effect: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_cast_event_id?: string
          p_character_id: string
          p_expected: Json
          p_kind: string
          p_operation_id: string
          p_value: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_character_effect_concentration_core: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_cast_event_id?: string
          p_character_id: string
          p_expected: Json
          p_kind: string
          p_operation_id: string
          p_value: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_character_effect_core: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_cast_event_id?: string
          p_character_id: string
          p_expected: Json
          p_kind: string
          p_operation_id: string
          p_value: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_character_effect_scene_core: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_cast_event_id?: string
          p_character_id: string
          p_expected: Json
          p_kind: string
          p_operation_id: string
          p_value: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_manage_character_activity: {
        Args: { p_character_id: string }
        Returns: boolean
      }
      cast_character_ritual: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_character_id: string
          p_expected_pe: number
          p_operation_id: string
          p_payload: Json
          p_pe_cost: number
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cast_character_ritual_concentration_core: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_character_id: string
          p_expected_pe: number
          p_operation_id: string
          p_payload: Json
          p_pe_cost: number
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cast_character_ritual_scene_core: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_character_id: string
          p_expected_pe: number
          p_operation_id: string
          p_payload: Json
          p_pe_cost: number
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_character_resource: {
        Args: {
          p_character_id: string
          p_expected_current: number
          p_expected_max: number
          p_mode: string
          p_operation_id: string
          p_resource: string
          p_value: number
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_character_resources: {
        Args: {
          p_character_id: string
          p_conditions: Json
          p_expected: Json
          p_operation_id: string
          p_values: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_sustained_ritual_action: {
        Args: {
          p_action: string
          p_character_id: string
          p_expected: Json
          p_expected_pe: number
          p_operation_id: string
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_sustained_ritual_end: {
        Args: {
          p_action: string
          p_character_id: string
          p_expected: Json
          p_operation_id: string
          p_reason: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_campaign_invite_v2: {
        Args: {
          p_campaign_id: string
          p_expires_at?: string
          p_max_uses?: number
        }
        Returns: {
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number | null
          uses: number
        }
        SetofOptions: {
          from: "*"
          to: "campaign_invites_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      effect_belongs_to_sustained: {
        Args: {
          p_character: string
          p_field: string
          p_ids: string[]
          p_item: Json
        }
        Returns: boolean
      }
      end_campaign_scene_v2: {
        Args: {
          p_campaign_id: string
          p_end_combat: boolean
          p_expected_revision: number
          p_operation_id: string
        }
        Returns: {
          campaign_id: string
          last_scene_ended_at: string | null
          revision: number
          scene_number: number
          state: Json
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_push_subscriptions_for_campaign: {
        Args: { _campaign_id: string; _user_ids?: string[] }
        Returns: {
          auth: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hide_character_activity: {
        Args: { p_character_id: string; p_hidden?: boolean }
        Returns: {
          character_id: string
          hidden_before: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_visibility"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_campaign_master: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_master_v2: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member_v2: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      join_campaign_with_invite: {
        Args: { p_character_id?: string; p_code: string }
        Returns: {
          already_member: boolean
          campaign_id: string
          campaign_name: string
          campaign_version: string
        }[]
      }
      list_character_activity: {
        Args: {
          p_before_created_at?: string
          p_before_id?: string
          p_category?: string
          p_character_id: string
          p_include_hidden?: boolean
          p_limit?: number
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_character_activity_filtered: {
        Args: {
          p_after_created_at?: string
          p_before_created_at?: string
          p_before_id?: string
          p_category?: string
          p_character_id: string
          p_include_hidden?: boolean
          p_limit?: number
          p_session_campaign_id?: string
          p_session_campaign_version?: string
          p_session_id?: string
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_character_activity_sessions: {
        Args: { p_character_id: string }
        Returns: {
          campaign_id: string
          campaign_name: string
          campaign_version: string
          id: string
          session_date: string
          session_number: number
          title: string
        }[]
      }
      list_character_sustained_rituals: {
        Args: { p_character_id: string }
        Returns: Json[]
      }
      reconcile_resource_conditions: {
        Args: {
          p_conditions: Json
          p_hp: number
          p_hp_loss?: number
          p_hp_max: number
          p_previous_hp: number
          p_previous_san: number
          p_san: number
          p_san_max: number
        }
        Returns: Json
      }
      record_character_activity: {
        Args: {
          p_campaign_id?: string
          p_campaign_version?: string
          p_category: string
          p_character_id: string
          p_operation_id: string
          p_payload: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_character_conditions: {
        Args: {
          p_character_id: string
          p_conditions: Json
          p_expected: Json
          p_operation_id: string
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_character_condition_turn: {
        Args: {
          p_character_id: string
          p_conditions: Json
          p_expected: Json
          p_operation_id: string
          p_resolution: Json
          p_values: Json
        }
        Returns: {
          author_id: string
          campaign_id: string | null
          campaign_version: string | null
          category: string
          character_id: string
          created_at: string
          id: string
          operation_id: string
          payload: Json
          request_hash: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "character_activity_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_campaign_combat_state_core_v2: {
        Args: {
          p_campaign_id: string
          p_expected_revision: number
          p_state: Json
        }
        Returns: {
          campaign_id: string
          last_scene_ended_at: string | null
          revision: number
          scene_number: number
          state: Json
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      save_campaign_combat_v2: {
        Args: {
          p_campaign_id: string
          p_expected_revision: number
          p_state: Json
        }
        Returns: {
          campaign_id: string
          last_scene_ended_at: string | null
          revision: number
          scene_number: number
          state: Json
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      validate_campaign_invite: {
        Args: { code: string }
        Returns: {
          campaign_id: string
          message: string
          valid: boolean
        }[]
      }
      validate_character_activity_context: {
        Args: {
          p_campaign_id: string
          p_campaign_version: string
          p_character_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
