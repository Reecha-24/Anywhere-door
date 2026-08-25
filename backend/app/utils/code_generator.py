import random
import string

def generate_pin_code(length: int = 6, numeric_only: bool = False) -> str:
    """Generates a random short PIN code or room code."""
    if numeric_only:
        digits = string.digits
        return ''.join(random.choice(digits) for _ in range(length))
    else:
        # Uppercase letters and numbers (excluding easily confused characters like O, 0, I, 1)
        chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
        return ''.join(random.choice(chars) for _ in range(length))

# final2
