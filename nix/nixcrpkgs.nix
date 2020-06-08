let

  nixpkgs = import ./nixpkgs.nix;
  osx_sdk = nixpkgs.sources.osx-sdk;

in

import ./nixcrpkgs/top.nix { inherit osx_sdk nixpkgs; }
