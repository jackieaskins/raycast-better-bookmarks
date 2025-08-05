# See full reference at https://devenv.sh/reference/options/

{ ... }:
{
  languages = {
    javascript = {
      enable = true;

      npm = {
        enable = true;
        install.enable = true;
      };
    };

    typescript.enable = true;
  };
}
