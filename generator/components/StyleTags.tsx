import { h, type VFC } from "../lib/jsx"

const StyleTags: VFC<{ styles: readonly (string | null | undefined)[] }> = ({
  styles,
}) => {
  return (
    <>
      {styles.map((x) =>
        x != null && x !== "" ? (
          <style>{{ type: "raw", value: x }}</style>
        ) : null,
      )}
    </>
  )
}

export default StyleTags
