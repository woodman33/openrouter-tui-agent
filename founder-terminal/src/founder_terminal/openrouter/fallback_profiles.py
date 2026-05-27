class ModelFallbackManager:
    """
    Manages OpenRouter's failover models arrays. If the primary model fails,
    OpenRouter automatically shifts the request down the list in priority order.
    """
    def __init__(self):
        # High-availability fallback routing profiles
        self.fallback_profiles = {
            "default_fast": [
                "google/gemini-2.5-flash",
                "openai/gpt-4o-mini",
                "meta-llama/llama-3.3-70b-instruct"
            ],
            "default_strong": [
                "anthropic/claude-3-5-sonnet",
                "google/gemini-2.5-pro",
                "openai/gpt-4o"
            ],
            "cheap_coder": [
                "qwen/qwen-2.5-coder-32b",
                "meta-llama/llama-3.3-70b-instruct",
                "google/gemini-2.5-flash"
            ]
        }

    def get_fallback_array(self, profile_name: str = "default_strong") -> list[str]:
        return self.fallback_profiles.get(profile_name, self.fallback_profiles["default_strong"])

    def build_openai_sdk_payload(self, primary_model: str, profile_name: str = "default_strong") -> dict:
        """
        Formats OpenRouter models failovers for the standard OpenAI Python SDK wrapper.
        The automatic failover array must be passed inside the 'extra_body' dictionary
        containing the 'models' key.
        """
        fallback_models = self.get_fallback_array(profile_name)
        # Ensure primary is not duplicated in the fallbacks
        fallbacks_filtered = [m for m in fallback_models if m != primary_model]
        
        # OpenRouter docs: The failover models goes inside the models list
        failover_list = [primary_model] + fallbacks_filtered
        
        return {
            "model": primary_model,
            "extra_body": {
                "models": failover_list
            }
        }

    def build_openrouter_sdk_payload(self, primary_model: str, profile_name: str = "default_strong") -> dict:
        """
        Formats OpenRouter models failovers for the direct OpenRouter TS/JS or Python SDK.
        The array is passed directly as the 'models' parameter in the request payload.
        """
        fallback_models = self.get_fallback_array(profile_name)
        fallbacks_filtered = [m for m in fallback_models if m != primary_model]
        failover_list = [primary_model] + fallbacks_filtered

        return {
            "models": failover_list
        }

if __name__ == "__main__":
    print("Testing Model Fallback Manager...")
    mgr = ModelFallbackManager()
    
    primary = "anthropic/claude-3-5-sonnet"
    print("\n--- OpenAI SDK Payload (with extra_body): ---")
    import pprint
    pprint.pprint(mgr.build_openai_sdk_payload(primary, "default_strong"))
    
    print("\n--- OpenRouter SDK Payload (with direct models parameter): ---")
    pprint.pprint(mgr.build_openrouter_sdk_payload(primary, "cheap_coder"))
