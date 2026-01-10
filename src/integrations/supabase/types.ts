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
    PostgrestVersion: "13.0.5"
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
          skills: Json
          strength: number
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
          skills?: Json
          strength?: number
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
          skills?: Json
          strength?: number
          updated_at?: string
          user_id?: string
          versatility_track?: Json | null
          vigor?: number
        }
        Relationships: []
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_campaign_master: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      validate_campaign_invite: {
        Args: { code: string }
        Returns: {
          campaign_id: string
          message: string
          valid: boolean
        }[]
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
