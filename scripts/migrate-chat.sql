-- ============================================
-- GREENLIGHT FITNESS - Chat System Migration
-- ============================================

-- 1. Add has_chat_access to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_chat_access BOOLEAN DEFAULT FALSE;

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_relationship_id UUID NOT NULL REFERENCES public.coaching_relationships(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'system')),
  content TEXT, -- text content or system message
  voice_url TEXT, -- storage URL for voice messages
  voice_duration_seconds INTEGER, -- duration of voice message
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_relationship ON public.chat_messages(coaching_relationship_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(receiver_id, is_read) WHERE is_read = FALSE;

-- 4. Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Users can only see messages where they are sender or receiver
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 6. Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
