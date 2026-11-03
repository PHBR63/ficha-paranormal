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
      campaign_attack_defense_choices_v2: {
        Row: {
          attack_event_id: string | null
          author_id: string
          created_at: string
          defender_id: string
          defense_type: string
          intent_id: string
          operation_id: string
          request_hash: string
        }
        Insert: {
          attack_event_id?: string | null
          author_id: string
          created_at?: string
          defender_id: string
          defense_type: string
          intent_id: string
          operation_id: string
          request_hash: string
        }
        Update: {
          attack_event_id?: string | null
          author_id?: string
          created_at?: string
          defender_id?: string
          defense_type?: string
          intent_id?: string
          operation_id?: string
          request_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_attack_defense_choices_v2_attack_event_id_fkey"
            columns: ["attack_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_defense_choices_v2_defender_id_fkey"
            columns: ["defender_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_defense_choices_v2_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: true
            referencedRelation: "campaign_attack_intents_v2"
            referencedColumns: ["operation_id"]
          },
        ]
      }
      campaign_attack_intents_v2: {
        Row: {
          attack_event_id: string | null
          attacker_id: string
          author_id: string
          campaign_id: string
          created_at: string
          melee: boolean
          operation_id: string
          reaction_source_id: string | null
          request_hash: string
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string
        }
        Insert: {
          attack_event_id?: string | null
          attacker_id: string
          author_id: string
          campaign_id: string
          created_at?: string
          melee: boolean
          operation_id: string
          reaction_source_id?: string | null
          request_hash: string
          round_number: number
          scene_number: number
          status?: string
          target_id: string
          turn_instance_id: string
          weapon_id: string
        }
        Update: {
          attack_event_id?: string | null
          attacker_id?: string
          author_id?: string
          campaign_id?: string
          created_at?: string
          melee?: boolean
          operation_id?: string
          reaction_source_id?: string | null
          request_hash?: string
          round_number?: number
          scene_number?: number
          status?: string
          target_id?: string
          turn_instance_id?: string
          weapon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_attack_intents_v2_attack_event_id_fkey"
            columns: ["attack_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_intents_v2_attacker_id_fkey"
            columns: ["attacker_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_intents_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_intents_v2_reaction_source_id_fkey"
            columns: ["reaction_source_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_intents_v2_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_attack_target_resolutions_v2: {
        Row: {
          attack_event_id: string
          author_id: string
          campaign_id: string
          created_at: string
          operation_id: string
          request_hash: string
          result: Json
          target_character_id: string
        }
        Insert: {
          attack_event_id: string
          author_id: string
          campaign_id: string
          created_at?: string
          operation_id: string
          request_hash: string
          result: Json
          target_character_id: string
        }
        Update: {
          attack_event_id?: string
          author_id?: string
          campaign_id?: string
          created_at?: string
          operation_id?: string
          request_hash?: string
          result?: Json
          target_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_attack_target_resolutions_v2_attack_event_id_fkey"
            columns: ["attack_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_target_resolutions_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_attack_target_resolutions_v2_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
      campaign_bulk_damage_operations: {
        Row: {
          author_id: string
          campaign_id: string
          created_at: string
          operation_id: string
          request_hash: string
          result: Json
        }
        Insert: {
          author_id: string
          campaign_id: string
          created_at?: string
          operation_id: string
          request_hash: string
          result: Json
        }
        Update: {
          author_id?: string
          campaign_id?: string
          created_at?: string
          operation_id?: string
          request_hash?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaign_bulk_damage_operations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_combat_maneuvers_v2: {
        Row: {
          actor_id: string
          attribute: string
          author_id: string
          campaign_id: string
          created_at: string
          maneuver_type: string
          operation_id: string
          request_hash: string
          resolution_author_id: string | null
          resolution_hash: string | null
          resolution_operation_id: string | null
          resolved_at: string | null
          result: Json | null
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string | null
        }
        Insert: {
          actor_id: string
          attribute: string
          author_id: string
          campaign_id: string
          created_at?: string
          maneuver_type: string
          operation_id: string
          request_hash: string
          resolution_author_id?: string | null
          resolution_hash?: string | null
          resolution_operation_id?: string | null
          resolved_at?: string | null
          result?: Json | null
          round_number: number
          scene_number: number
          status?: string
          target_id: string
          turn_instance_id: string
          weapon_id?: string | null
        }
        Update: {
          actor_id?: string
          attribute?: string
          author_id?: string
          campaign_id?: string
          created_at?: string
          maneuver_type?: string
          operation_id?: string
          request_hash?: string
          resolution_author_id?: string | null
          resolution_hash?: string | null
          resolution_operation_id?: string | null
          resolved_at?: string | null
          result?: Json | null
          round_number?: number
          scene_number?: number
          status?: string
          target_id?: string
          turn_instance_id?: string
          weapon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_combat_maneuvers_v2_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_combat_maneuvers_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_combat_maneuvers_v2_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
          turn_instance_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          last_scene_ended_at?: string | null
          revision?: number
          scene_number?: number
          state?: Json
          turn_instance_id?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          last_scene_ended_at?: string | null
          revision?: number
          scene_number?: number
          state?: Json
          turn_instance_id?: string
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
      campaign_grapples_v2: {
        Row: {
          active: boolean
          actor_id: string
          campaign_id: string
          ended_at: string | null
          ended_by: string | null
          maneuver_operation_id: string
          started_at: string
          target_id: string
        }
        Insert: {
          active?: boolean
          actor_id: string
          campaign_id: string
          ended_at?: string | null
          ended_by?: string | null
          maneuver_operation_id: string
          started_at?: string
          target_id: string
        }
        Update: {
          active?: boolean
          actor_id?: string
          campaign_id?: string
          ended_at?: string | null
          ended_by?: string | null
          maneuver_operation_id?: string
          started_at?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_grapples_v2_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_grapples_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_grapples_v2_maneuver_operation_id_fkey"
            columns: ["maneuver_operation_id"]
            isOneToOne: true
            referencedRelation: "campaign_combat_maneuvers_v2"
            referencedColumns: ["operation_id"]
          },
          {
            foreignKeyName: "campaign_grapples_v2_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
      campaign_massive_damage_resolutions_v2: {
        Row: {
          author_id: string
          campaign_id: string
          character_id: string
          created_at: string
          operation_id: string
          request_hash: string
          result: Json
          source_event_id: string
        }
        Insert: {
          author_id: string
          campaign_id: string
          character_id: string
          created_at?: string
          operation_id: string
          request_hash: string
          result: Json
          source_event_id: string
        }
        Update: {
          author_id?: string
          campaign_id?: string
          character_id?: string
          created_at?: string
          operation_id?: string
          request_hash?: string
          result?: Json
          source_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_massive_damage_resolutions_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_massive_damage_resolutions_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_massive_damage_resolutions_v2_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
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
      character_accessory_reviews: {
        Row: {
          approved: boolean
          character_id: string
          in_use: boolean
          item_id: string
          reviewed_by: string
          signature: string
        }
        Insert: {
          approved?: boolean
          character_id: string
          in_use?: boolean
          item_id: string
          reviewed_by: string
          signature: string
        }
        Update: {
          approved?: boolean
          character_id?: string
          in_use?: boolean
          item_id?: string
          reviewed_by?: string
          signature?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_accessory_reviews_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
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
      character_bleeding_turn_confirmations: {
        Row: {
          character_id: string
          operation_id: string
          turn_key: string
        }
        Insert: {
          character_id: string
          operation_id: string
          turn_key: string
        }
        Update: {
          character_id?: string
          operation_id?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_bleeding_turn_confirmations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_bleeding_turn_confirmations_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
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
      character_combat_actions: {
        Row: {
          action_kind: string
          character_id: string
          created_at: string
          operation_id: string
          source: string
          turn_key: string
        }
        Insert: {
          action_kind: string
          character_id: string
          created_at?: string
          operation_id: string
          source: string
          turn_key: string
        }
        Update: {
          action_kind?: string
          character_id?: string
          created_at?: string
          operation_id?: string
          source?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_combat_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_combat_actions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_combat_turn_starts: {
        Row: {
          campaign_id: string
          character_id: string
          started_at: string
          turn_instance_id: string
        }
        Insert: {
          campaign_id: string
          character_id: string
          started_at: string
          turn_instance_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string
          started_at?: string
          turn_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_combat_turn_starts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_condition_effect_turn_confirmations: {
        Row: {
          character_id: string
          condition_id: string
          condition_label: string
          created_at: string
          effect_key: string
          operation_id: string
          turn_key: string
        }
        Insert: {
          character_id: string
          condition_id: string
          condition_label: string
          created_at?: string
          effect_key: string
          operation_id: string
          turn_key: string
        }
        Update: {
          character_id?: string
          condition_id?: string
          condition_label?: string
          created_at?: string
          effect_key?: string
          operation_id?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_condition_effect_turn_confirmations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_condition_effect_turn_confirmations_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_creation_backups: {
        Row: {
          character_id: string
          reconciled_at: string | null
          sanity_loss_snapshot: Json | null
          saved_at: string
          snapshot: Json
        }
        Insert: {
          character_id: string
          reconciled_at?: string | null
          sanity_loss_snapshot?: Json | null
          saved_at?: string
          snapshot: Json
        }
        Update: {
          character_id?: string
          reconciled_at?: string | null
          sanity_loss_snapshot?: Json | null
          saved_at?: string
          snapshot?: Json
        }
        Relationships: []
      }
      character_creation_operations: {
        Row: {
          character_id: string
          created_at: string
          operation_id: string
          request_hash: string
          result: Json
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          operation_id: string
          request_hash: string
          result: Json
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          operation_id?: string
          request_hash?: string
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_creation_operations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_estrategista_grants: {
        Row: {
          granted_at: string
          operation_id: string
          review_approved_at: string | null
          review_reason: string | null
          review_required: boolean
          reviewed_by: string | null
          source_character_id: string
          status: string
          target_character_id: string
          turn_snapshot: Json | null
          used_at: string | null
        }
        Insert: {
          granted_at?: string
          operation_id: string
          review_approved_at?: string | null
          review_reason?: string | null
          review_required?: boolean
          reviewed_by?: string | null
          source_character_id: string
          status?: string
          target_character_id: string
          turn_snapshot?: Json | null
          used_at?: string | null
        }
        Update: {
          granted_at?: string
          operation_id?: string
          review_approved_at?: string | null
          review_reason?: string | null
          review_required?: boolean
          reviewed_by?: string | null
          source_character_id?: string
          status?: string
          target_character_id?: string
          turn_snapshot?: Json | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_estrategista_grants_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_estrategista_grants_source_character_id_fkey"
            columns: ["source_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_estrategista_grants_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_inspirar_rerolls: {
        Row: {
          original_event_id: string
          reroll_event_id: string
          source_event_id: string
        }
        Insert: {
          original_event_id: string
          reroll_event_id: string
          source_event_id: string
        }
        Update: {
          original_event_id?: string
          reroll_event_id?: string
          source_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_inspirar_rerolls_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_inspirar_rerolls_reroll_event_id_fkey"
            columns: ["reroll_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_inspirar_rerolls_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_manual_turns: {
        Row: {
          active: boolean
          character_id: string
          turn_number: number
        }
        Insert: {
          active?: boolean
          character_id: string
          turn_number?: number
        }
        Update: {
          active?: boolean
          character_id?: string
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_manual_turns_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_medical_extra_actions: {
        Row: {
          character_id: string
          created_at: string
          operation_id: string
          source_name: string
          turn_key: string
        }
        Insert: {
          character_id: string
          created_at?: string
          operation_id: string
          source_name: string
          turn_key: string
        }
        Update: {
          character_id?: string
          created_at?: string
          operation_id?: string
          source_name?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_medical_extra_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_medical_extra_actions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_medical_standard_actions: {
        Row: {
          ability: string
          character_id: string
          created_at: string
          operation_id: string
          turn_key: string
        }
        Insert: {
          ability: string
          character_id: string
          created_at?: string
          operation_id: string
          turn_key: string
        }
        Update: {
          ability?: string
          character_id?: string
          created_at?: string
          operation_id?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_medical_standard_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_medical_standard_actions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_paranormal_san_losses: {
        Row: {
          character_id: string
          effective_max: number
          loss: number
        }
        Insert: {
          character_id: string
          effective_max: number
          loss: number
        }
        Update: {
          character_id?: string
          effective_max?: number
          loss?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_paranormal_san_losses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_pe_turn_spending: {
        Row: {
          character_id: string
          cost: number
          kind: string
          operation_id: string
          turn_key: string | null
        }
        Insert: {
          character_id: string
          cost: number
          kind: string
          operation_id: string
          turn_key?: string | null
        }
        Update: {
          character_id?: string
          cost?: number
          kind?: string
          operation_id?: string
          turn_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_pe_turn_spending_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_pe_turn_spending_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
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
      character_prepared_actions_v2: {
        Row: {
          action_description: string
          campaign_id: string
          character_id: string
          created_at: string
          declared_kind: string
          operation_id: string
          round_number: number
          scene_number: number
          source_turn_instance_id: string
          status: string
          trigger_description: string
          trigger_operation_id: string | null
        }
        Insert: {
          action_description: string
          campaign_id: string
          character_id: string
          created_at?: string
          declared_kind: string
          operation_id: string
          round_number: number
          scene_number: number
          source_turn_instance_id: string
          status?: string
          trigger_description: string
          trigger_operation_id?: string | null
        }
        Update: {
          action_description?: string
          campaign_id?: string
          character_id?: string
          created_at?: string
          declared_kind?: string
          operation_id?: string
          round_number?: number
          scene_number?: number
          source_turn_instance_id?: string
          status?: string
          trigger_description?: string
          trigger_operation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_prepared_actions_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_prepared_actions_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_prepared_actions_v2_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_prepared_actions_v2_trigger_operation_id_fkey"
            columns: ["trigger_operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      character_reanimation_deaths: {
        Row: {
          campaign_id: string
          cause: string
          confirmed_by: string
          created_at: string
          id: string
          resolved_at: string | null
          revived_by_operation_id: string | null
          scene_number: number
          target_character_id: string
        }
        Insert: {
          campaign_id: string
          cause: string
          confirmed_by: string
          created_at?: string
          id: string
          resolved_at?: string | null
          revived_by_operation_id?: string | null
          scene_number: number
          target_character_id: string
        }
        Update: {
          campaign_id?: string
          cause?: string
          confirmed_by?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          revived_by_operation_id?: string | null
          scene_number?: number
          target_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_reanimation_deaths_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_reanimation_deaths_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_reanimation_deaths_revived_by_operation_id_fkey"
            columns: ["revived_by_operation_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_reanimation_deaths_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_reanimation_uses: {
        Row: {
          campaign_id: string
          operation_id: string
          scene_number: number
          source_character_id: string
        }
        Insert: {
          campaign_id: string
          operation_id: string
          scene_number: number
          source_character_id: string
        }
        Update: {
          campaign_id?: string
          operation_id?: string
          scene_number?: number
          source_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_reanimation_uses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_reanimation_uses_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_reanimation_uses_source_character_id_fkey"
            columns: ["source_character_id"]
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
      character_resgate_defense_grants: {
        Row: {
          campaign_id: string | null
          created_at: string
          manual_turn_number: number | null
          mode: string
          operation_id: string
          reviewed_source_event_id: string | null
          round_number: number | null
          scene_number: number | null
          source_character_id: string
          source_turn_instance_id: string | null
          target_character_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          manual_turn_number?: number | null
          mode: string
          operation_id: string
          reviewed_source_event_id?: string | null
          round_number?: number | null
          scene_number?: number | null
          source_character_id: string
          source_turn_instance_id?: string | null
          target_character_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          manual_turn_number?: number | null
          mode?: string
          operation_id?: string
          reviewed_source_event_id?: string | null
          round_number?: number | null
          scene_number?: number | null
          source_character_id?: string
          source_turn_instance_id?: string | null
          target_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_resgate_defense_grants_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_resgate_defense_grants_reviewed_source_event_id_fkey"
            columns: ["reviewed_source_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_resgate_defense_grants_source_character_id_fkey"
            columns: ["source_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_resgate_defense_grants_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_resgate_movements: {
        Row: {
          character_id: string
          created_at: string
          operation_id: string
          target_character_id: string
          turn_key: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          operation_id: string
          target_character_id: string
          turn_key?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          operation_id?: string
          target_character_id?: string
          turn_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_resgate_movements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_resgate_movements_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_resgate_movements_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_ritual_knowledge: {
        Row: {
          character_id: string
          known_before_blade: boolean
          review_event_id: string
          reviewed_by: string
          ritual_id: string
          source: string
        }
        Insert: {
          character_id: string
          known_before_blade?: boolean
          review_event_id: string
          reviewed_by: string
          ritual_id: string
          source: string
        }
        Update: {
          character_id?: string
          known_before_blade?: boolean
          review_event_id?: string
          reviewed_by?: string
          ritual_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_ritual_knowledge_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ritual_knowledge_review_event_id_fkey"
            columns: ["review_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
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
      character_special_defenses_v2: {
        Row: {
          attack_event_id: string
          campaign_id: string
          character_id: string
          created_at: string
          defense_type: string
          operation_id: string
          round_number: number
          scene_number: number
        }
        Insert: {
          attack_event_id: string
          campaign_id: string
          character_id: string
          created_at?: string
          defense_type: string
          operation_id: string
          round_number: number
          scene_number: number
        }
        Update: {
          attack_event_id?: string
          campaign_id?: string
          character_id?: string
          created_at?: string
          defense_type?: string
          operation_id?: string
          round_number?: number
          scene_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_special_defenses_v2_attack_event_id_fkey"
            columns: ["attack_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_special_defenses_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_special_defenses_v2_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_special_defenses_v2_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "character_activity_events"
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
      character_temporary_resources: {
        Row: {
          campaign_id: string | null
          character_id: string
          created_at: string
          damage_types: string[] | null
          id: string
          remaining: number
          resource: string
          scene_number: number | null
          source_key: string
          source_name: string
        }
        Insert: {
          campaign_id?: string | null
          character_id: string
          created_at?: string
          damage_types?: string[] | null
          id?: string
          remaining: number
          resource: string
          scene_number?: number | null
          source_key: string
          source_name: string
        }
        Update: {
          campaign_id?: string | null
          character_id?: string
          created_at?: string
          damage_types?: string[] | null
          id?: string
          remaining?: number
          resource?: string
          scene_number?: number | null
          source_key?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_temporary_resources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_temporary_resources_character_id_fkey"
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
          class_power_choices: Json | null
          class_track: string | null
          concept: string | null
          conditions: Json
          created_at: string
          creation_data: Json | null
          creation_review: Json
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
          nonlethal_damage: number
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
          creation_data?: Json | null
          creation_review?: Json
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
          nonlethal_damage?: number
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
          creation_data?: Json | null
          creation_review?: Json
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
          nonlethal_damage?: number
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
      fragmentation_target_resolutions: {
        Row: {
          active: boolean
          applied_event_id: string | null
          effect_conditions: string[]
          excluded: boolean
          explosion_id: string
          target_id: string
        }
        Insert: {
          active?: boolean
          applied_event_id?: string | null
          effect_conditions?: string[]
          excluded?: boolean
          explosion_id: string
          target_id: string
        }
        Update: {
          active?: boolean
          applied_event_id?: string | null
          effect_conditions?: string[]
          excluded?: boolean
          explosion_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragmentation_target_resolutions_applied_event_id_fkey"
            columns: ["applied_event_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fragmentation_target_resolutions_explosion_id_fkey"
            columns: ["explosion_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fragmentation_target_resolutions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
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
      ritual_minimum_pe_costs: {
        Row: {
          minimum_cost: number
          ritual_id: string
        }
        Insert: {
          minimum_cost: number
          ritual_id: string
        }
        Update: {
          minimum_cost?: number
          ritual_id?: string
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
      sustained_turn_confirmations: {
        Row: {
          operation_id: string
          sustained_id: string
          turn_key: string
        }
        Insert: {
          operation_id: string
          sustained_id: string
          turn_key: string
        }
        Update: {
          operation_id?: string
          sustained_id?: string
          turn_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustained_turn_confirmations_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "character_activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustained_turn_confirmations_sustained_id_fkey"
            columns: ["sustained_id"]
            isOneToOne: false
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
      accessory_bonuses: { Args: { item: Json }; Returns: Json }
      accessory_signature: { Args: { item: Json }; Returns: string }
      activity_json_integer: {
        Args: { p_max: number; p_min: number; p_value: Json }
        Returns: boolean
      }
      append_unique_maneuver_condition_v2: {
        Args: {
          p_conditions: Json
          p_id: string
          p_name: string
          p_operation_id: string
        }
        Returns: Json
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
      apply_character_effect_aging_core: {
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
      apply_character_effect_temporary_core: {
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
      apply_character_healing_priority: {
        Args: {
          p_character_id: string
          p_expected_hp: number
          p_expected_nonlethal?: number
          p_requested: number
          p_source_operation_id?: string
        }
        Returns: Json
      }
      assert_explosive_actor_turn: {
        Args: { p_budget: Json; p_character_id: string }
        Returns: undefined
      }
      begin_character_manual_turn: {
        Args: {
          p_character_id: string
          p_expected_turn: number
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
      begin_character_manual_turn_budget_core: {
        Args: {
          p_character_id: string
          p_expected_turn: number
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
      can_manage_character_activity: {
        Args: { p_character_id: string }
        Returns: boolean
      }
      can_review_character_ritual: {
        Args: { p_character_id: string }
        Returns: boolean
      }
      cancel_campaign_attack_intent_v2: {
        Args: { p_intent_id: string }
        Returns: {
          attack_event_id: string | null
          attacker_id: string
          author_id: string
          campaign_id: string
          created_at: string
          melee: boolean
          operation_id: string
          reaction_source_id: string | null
          request_hash: string
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_attack_intents_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_campaign_combat_maneuver_v2: {
        Args: { p_operation_id: string }
        Returns: {
          actor_id: string
          attribute: string
          author_id: string
          campaign_id: string
          created_at: string
          maneuver_type: string
          operation_id: string
          request_hash: string
          resolution_author_id: string | null
          resolution_hash: string | null
          resolution_operation_id: string | null
          resolved_at: string | null
          result: Json | null
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "campaign_combat_maneuvers_v2"
          isOneToOne: true
          isSetofReturn: false
        }
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
      cast_character_ritual_action_core: {
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
      cast_character_ritual_budget_core: {
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
      cast_character_ritual_paranormal_core: {
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
      cast_character_ritual_situational_core: {
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
      change_character_resource_nonlethal_legacy: {
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
      change_character_resources_nonlethal_legacy: {
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
      character_creation_catalog: { Args: never; Returns: Json }
      character_has_martial_artist_v2: {
        Args: { p_character: Database["public"]["Tables"]["characters"]["Row"] }
        Returns: boolean
      }
      character_has_medical_kit: {
        Args: { p_inventory: Json }
        Returns: boolean
      }
      character_maneuver_agility_allowed_v2: {
        Args: {
          p_character: Database["public"]["Tables"]["characters"]["Row"]
          p_weapon_id?: string
        }
        Returns: boolean
      }
      character_resgate_control_key: {
        Args: { p_budget: Json }
        Returns: string
      }
      combat_maneuver_effect_v2: {
        Args: { p_actor_total: number; p_target_total: number; p_type: string }
        Returns: Json
      }
      confirm_campaign_attack_defense_choice_v2: {
        Args: {
          p_defense_type: string
          p_intent_id: string
          p_operation_id: string
        }
        Returns: {
          attack_event_id: string | null
          author_id: string
          created_at: string
          defender_id: string
          defense_type: string
          intent_id: string
          operation_id: string
          request_hash: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_attack_defense_choices_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_campaign_attack_target_pre_conditions_core: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_expected_hp: number
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_resolution: Json
          p_target_character_id: string
        }
        Returns: Json
      }
      confirm_campaign_attack_target_pre_intent_core: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_expected_hp: number
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_resolution: Json
          p_target_character_id: string
        }
        Returns: Json
      }
      confirm_campaign_attack_target_v2: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_expected_hp: number
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_resolution: Json
          p_target_character_id: string
        }
        Returns: Json
      }
      confirm_campaign_attack_target_v3: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_expected_hp: number
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_resolution: Json
          p_target_character_id: string
        }
        Returns: Json
      }
      confirm_campaign_attack_target_v4: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_expected_hp: number
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_resolution: Json
          p_target_character_id: string
        }
        Returns: Json
      }
      confirm_campaign_bulk_damage: {
        Args: {
          p_campaign_id: string
          p_operation_id: string
          p_source: string
          p_targets: Json
        }
        Returns: Json
      }
      confirm_campaign_bulk_damage_pre_conditions_core: {
        Args: {
          p_campaign_id: string
          p_operation_id: string
          p_source: string
          p_targets: Json
        }
        Returns: Json
      }
      confirm_campaign_bulk_damage_v2: {
        Args: {
          p_campaign_id: string
          p_operation_id: string
          p_source: string
          p_targets: Json
        }
        Returns: Json
      }
      confirm_campaign_massive_damage_v2: {
        Args: {
          p_campaign_id: string
          p_expected_hp: number
          p_operation_id: string
          p_source_event_id: string
        }
        Returns: Json
      }
      confirm_character_accessory: {
        Args: {
          p_action: string
          p_character_id: string
          p_enabled: boolean
          p_item_id: string
          p_note?: string
          p_operation_id: string
          p_signature: string
        }
        Returns: Json
      }
      confirm_character_combat_attack: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_combat_attack_action_core: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_combat_attack_damage_mode_core: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_combat_attack_pre_defense_core: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_combat_attack_without_mirar_guard: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_combat_attack_without_pontaria_guard: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_condition_turn: {
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
      confirm_character_condition_turn_effect_core: {
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
      confirm_character_counterattack_damage_mode_core_v2: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_counterattack_roll_v2: {
        Args: {
          p_character_id: string
          p_expected_cost: number
          p_expected_pe: number
          p_expected_turn_key: string
          p_operation_id: string
          p_payload: Json
          p_selection: Json
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
      confirm_character_equipe_trauma: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_equipe_trauma_action_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_equipe_trauma_incapacity_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_estrategista: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_explosive_action: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_explosive_control: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_explosive_effect: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_explosive_targets: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_fragmentation_damage: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_fragmentation_targets: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_fragmentation_throw: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_inspirar_confianca: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_item_action: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_medical_extra_action: {
        Args: {
          p_campaign_id: string
          p_character_id: string
          p_expected_turn_key: string
          p_operation_id: string
          p_source_name: string
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
      confirm_character_mirar: {
        Args: {
          p_character_id: string
          p_expected_turn_key: string
          p_operation_id: string
          p_weapon_id: string
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
      confirm_character_mirar_action_core: {
        Args: {
          p_character_id: string
          p_expected_turn_key: string
          p_operation_id: string
          p_weapon_id: string
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
      confirm_character_paramedico: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_paramedico_action_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_paramedico_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_paramedico_incapacity_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_paramedico_nonlethal_legacy_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_post_attack_stealth: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_reanimacao: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_reanimacao_action_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_reanimacao_death: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_resgate_manual_review: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_resgate_movement: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_resgate_movement_action_core: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_resgate_review: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_request: Json
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
      confirm_character_ritual_knowledge: {
        Args: {
          p_character_id: string
          p_operation_id: string
          p_review: Json
          p_ritual_id: string
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
      confirm_character_special_defense_pre_intent_core: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_character_id: string
          p_defense_type: string
          p_expected_round: number
          p_expected_scene: number
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
      confirm_character_special_defense_v2: {
        Args: {
          p_attack_event_id: string
          p_campaign_id: string
          p_character_id: string
          p_defense_type: string
          p_expected_round: number
          p_expected_scene: number
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
      confirm_sustained_ritual_action_turn_core: {
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
      confirm_sustained_ritual_maintenance: {
        Args: {
          p_character_id: string
          p_expected: Json
          p_expected_pe: number
          p_operation_id: string
          p_turn: Json
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
      confirm_sustained_ritual_maintenance_budget_core: {
        Args: {
          p_character_id: string
          p_expected: Json
          p_expected_pe: number
          p_operation_id: string
          p_turn: Json
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
      confirm_temporary_resource: {
        Args: {
          p_amount: number
          p_character_id: string
          p_cumulative?: boolean
          p_operation_id: string
          p_resource: string
          p_source_key: string
          p_source_name: string
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
      consume_temporary_resource: {
        Args: {
          p_amount: number
          p_character_id: string
          p_damage_type?: string
          p_resource: string
        }
        Returns: number
      }
      create_campaign_counterattack_intent_v2: {
        Args: {
          p_campaign_id: string
          p_defense_event_id: string
          p_expected_round: number
          p_expected_scene: number
          p_operation_id: string
          p_weapon_id: string
        }
        Returns: {
          attack_event_id: string | null
          attacker_id: string
          author_id: string
          campaign_id: string
          created_at: string
          melee: boolean
          operation_id: string
          reaction_source_id: string | null
          request_hash: string
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_attack_intents_v2"
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
      create_character_base: {
        Args: { p_build: Json; p_campaign_id?: string; p_operation_id: string }
        Returns: Json
      }
      creation_apply_grade: {
        Args: { p_form: Json; p_grades: Json; p_nex: number }
        Returns: Json
      }
      creation_identifier: { Args: { p_value: string }; Returns: string }
      creation_require: {
        Args: { p_message: string; p_valid: boolean }
        Returns: undefined
      }
      declare_campaign_attack_intent_v2: {
        Args: {
          p_attacker_id: string
          p_campaign_id: string
          p_expected_round: number
          p_expected_scene: number
          p_expected_turn_instance_id: string
          p_operation_id: string
          p_target_id: string
          p_weapon_id: string
        }
        Returns: {
          attack_event_id: string | null
          attacker_id: string
          author_id: string
          campaign_id: string
          created_at: string
          melee: boolean
          operation_id: string
          reaction_source_id: string | null
          request_hash: string
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_attack_intents_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      declare_campaign_combat_maneuver_v2: {
        Args: {
          p_actor_id: string
          p_attribute: string
          p_campaign_id: string
          p_expected_round: number
          p_expected_scene: number
          p_expected_turn_instance_id: string
          p_maneuver_type: string
          p_operation_id: string
          p_target_id: string
          p_weapon_id: string
        }
        Returns: {
          actor_id: string
          attribute: string
          author_id: string
          campaign_id: string
          created_at: string
          maneuver_type: string
          operation_id: string
          request_hash: string
          resolution_author_id: string | null
          resolution_hash: string | null
          resolution_operation_id: string | null
          resolved_at: string | null
          result: Json | null
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "campaign_combat_maneuvers_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dismiss_character_mirar: {
        Args: { p_aim_operation_id: string; p_character_id: string }
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
      effect_belongs_to_sustained: {
        Args: {
          p_character: string
          p_field: string
          p_ids: string[]
          p_item: Json
        }
        Returns: boolean
      }
      end_campaign_scene_temporary_core: {
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
          turn_instance_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
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
          turn_instance_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      end_temporary_resource: {
        Args: {
          p_character_id: string
          p_expected: number
          p_operation_id: string
          p_resource_id: string
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
      explosive_conditions: {
        Args: { p_ids: string[]; p_original: Json; p_source: string }
        Returns: Json
      }
      explosive_type: { Args: { p_id: string }; Returns: string }
      get_character_accessories: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_equipe_trauma_options: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_estrategista_targets: {
        Args: { p_character_id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_character_explosives: {
        Args: { p_character_id: string; p_page?: number }
        Returns: Json
      }
      get_character_fragmentation: {
        Args: { p_character_id: string; p_page?: number }
        Returns: Json
      }
      get_character_inspirar_tests: {
        Args: { p_character_id: string }
        Returns: {
          event_id: string
          original_total: number
          performed_at: string
          target_id: string
          target_name: string
          test_label: string
          test_type: string
        }[]
      }
      get_character_medical_action_status: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_medical_capability: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_mirar_status: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_paramedico_options: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_pe_budget: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_reanimacao_options: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_resgate_defense_status: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_resgate_movement_options: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_resgate_review_options: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_resgate_review_options_combat_core: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_ritual_situational: {
        Args: { p_character_id: string; p_ritual_id: string }
        Returns: Json
      }
      get_character_ritual_turn: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_ritual_turn_budget_core: {
        Args: { p_character_id: string }
        Returns: Json
      }
      get_character_turn_action_status: {
        Args: { p_character_id: string }
        Returns: Json
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
      get_unique_equipped_maneuver_item_v2: {
        Args: { p_inventory: Json; p_item_id: string }
        Returns: Json
      }
      grant_character_resgate_defense: {
        Args: {
          p_budget: Json
          p_operation_id: string
          p_source_id: string
          p_target_id: string
        }
        Returns: undefined
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
      is_fragmentation_master: {
        Args: { p_source: string; p_target?: string }
        Returns: boolean
      }
      is_removable_trauma_condition: {
        Args: { p_condition: string; p_hp: number }
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
      list_campaign_counterattacks_pending_v2: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      list_campaign_massive_damage_pending_v2: {
        Args: { p_campaign_id: string }
        Returns: Json
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
      list_character_estrategista_grants: {
        Args: { p_character_id: string }
        Returns: {
          can_review: boolean
          granted_at: string
          operation_id: string
          review_required: boolean
          reviewed: boolean
          source_name: string
          status: string
          turn_controlled: boolean
        }[]
      }
      list_character_sustained_rituals: {
        Args: { p_character_id: string }
        Returns: Json[]
      }
      list_character_temporary_resources: {
        Args: { p_character_id: string }
        Returns: Json[]
      }
      lock_character_pe_turn: {
        Args: { p_character_id: string }
        Returns: undefined
      }
      maneuver_item_is_agile_v2: { Args: { p_item: Json }; Returns: boolean }
      pause_character_manual_turn: {
        Args: {
          p_character_id: string
          p_expected_turn: number
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
      physical_explosive_action_allowed: {
        Args: { p_conditions: Json }
        Returns: boolean
      }
      prepare_character_action_v2: {
        Args: {
          p_action_description: string
          p_campaign_id: string
          p_character_id: string
          p_declared_kind: string
          p_expected_round: number
          p_expected_scene: number
          p_expected_turn_instance_id: string
          p_operation_id: string
          p_trigger_description: string
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
      reconcile_nonlethal_conditions: {
        Args: {
          p_conditions: Json
          p_hp: number
          p_hp_max: number
          p_nonlethal: number
          p_source_operation_id?: string
        }
        Returns: Json
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
      record_character_combat_action: {
        Args: {
          p_action_kind: string
          p_character_id: string
          p_event_id: string
          p_source: string
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
      record_character_medical_standard_action: {
        Args: { p_ability: string; p_character_id: string; p_event_id: string }
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
      record_ritual_pe_budget: {
        Args: {
          p_budget: Json
          p_cost: number
          p_event_id: string
          p_kind: string
          p_minimum: boolean
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
      release_campaign_grapple_v2: {
        Args: { p_maneuver_id: string }
        Returns: {
          active: boolean
          actor_id: string
          campaign_id: string
          ended_at: string | null
          ended_by: string | null
          maneuver_operation_id: string
          started_at: string
          target_id: string
        }
        SetofOptions: {
          from: "*"
          to: "campaign_grapples_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_explosive_conditions: {
        Args: { p_all_fire?: boolean; p_original: Json; p_source: string }
        Returns: Json
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
      require_character_medical_action: {
        Args: { p_character_id: string }
        Returns: undefined
      }
      resgate_review_effect_label: {
        Args: { p_payload: Json }
        Returns: string
      }
      resgate_reviewable_effect: { Args: { p_payload: Json }; Returns: boolean }
      resolve_activity_skill_test: {
        Args: { p_dt: number; p_test: Json }
        Returns: Json
      }
      resolve_campaign_combat_maneuver_v2: {
        Args: {
          p_maneuver_id: string
          p_operation_id: string
          p_resolution: Json
        }
        Returns: {
          actor_id: string
          attribute: string
          author_id: string
          campaign_id: string
          created_at: string
          maneuver_type: string
          operation_id: string
          request_hash: string
          resolution_author_id: string | null
          resolution_hash: string | null
          resolution_operation_id: string | null
          resolved_at: string | null
          result: Json | null
          round_number: number
          scene_number: number
          status: string
          target_id: string
          turn_instance_id: string
          weapon_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "campaign_combat_maneuvers_v2"
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
      resolve_weapon_concealment: {
        Args: {
          p_blind: boolean
          p_defense: number
          p_die?: number
          p_level: string
          p_weapon: Json
        }
        Returns: Json
      }
      review_character_estrategista_grant: {
        Args: {
          p_character_id: string
          p_grant_operation_id: string
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
      ritual_execution_catalog: { Args: never; Returns: Json }
      roll_maneuver_luta_v2: {
        Args: {
          p_attribute: string
          p_character: Database["public"]["Tables"]["characters"]["Row"]
          p_modifier: number
        }
        Returns: Json
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
          turn_instance_id: string
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
          turn_instance_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "campaign_combat_state_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      trigger_character_prepared_action_v2: {
        Args: {
          p_expected_round: number
          p_expected_scene: number
          p_expected_turn_instance_id: string
          p_operation_id: string
          p_prepared_id: string
          p_trigger_note: string
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
      use_character_estrategista_grant: {
        Args: {
          p_character_id: string
          p_grant_operation_id: string
          p_next_turn_confirmed: boolean
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
      validate_character_creation: { Args: { p: Json }; Returns: Json }
      validate_combat_damage_mode: {
        Args: { p_character_id: string; p_payload: Json; p_selection: Json }
        Returns: Json
      }
      weapon_burst_capabilities: { Args: { weapon: Json }; Returns: Json }
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
