document.addEventListener("DOMContentLoaded", () => {
  const inp = document.querySelector("#inp");
  const btn = document.querySelector("#btn");
  const boxes = document.querySelectorAll(".box");

  // استرجاع القيم المخزنة في localStorage عند تحميل الصفحة
  function loadBoxTitles() {
    boxes.forEach((box, index) => {
      const title = localStorage.getItem(`box${index + 1}`);
      if (title) {
        const inputTitle = box.querySelector(".box-title");
        inputTitle.value = title;
      }
    });
  }

  // استرجاع العناصر المخزنة في localStorage عند تحميل الصفحة
  function loadItems() {
    const allItems = JSON.parse(localStorage.getItem("items")) || [];
    allItems.forEach((item) => {
      addItem(item.text, item.boxIndex, false); // false تعني عدم إضافة عنصر جديد، بل تحديث الموقع
    });
  }

  loadBoxTitles();
  loadItems();

  btn.onclick = (e) => {
    e.preventDefault();
    addItemIfValid();
  };

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItemIfValid();
    }
  });

  function addItemIfValid() {
    const value = inp.value.trim();
    if (value !== "") {
      addItem(value, 0, true); // true تعني إضافة عنصر جديد
      inp.value = "";
    }
  }

  function addItem(text, boxIndex, isNew) {
    const item = document.createElement("p");
    item.textContent = text;
    item.className = "item";
    item.draggable = true;

    // افترضنا أن العنصر يضاف إلى الصندوق بناءً على boxIndex
    const targetBox = boxes[boxIndex];
    const container = targetBox.querySelector(".container");

    if (isNew) {
      container.insertBefore(item, container.firstChild);
    } else {
      const existingItem = Array.from(container.querySelectorAll(".item")).find(
        (i) => i.textContent === text
      );
      if (existingItem) {
        existingItem.remove();
      }
      container.insertBefore(item, container.firstChild);
    }

    initializeDragEvents(item);
    initializeTouchEvents(item);

    // حفظ العناصر في localStorage
    updateLocalStorage();
  }

  function initializeDragEvents(item) {
    let drag = null;

    item.addEventListener("dragstart", () => {
      drag = item;
      item.style.opacity = "0.5";
    });

    item.addEventListener("dragend", () => {
      drag = null;
      item.style.opacity = "1";
    });

    boxes.forEach((box) => {
      const input = box.querySelector("input");
      const container = box.querySelector(".container");
      box.addEventListener("dragover", (e) => {
        e.preventDefault();
        box.style.backgroundColor = box.getAttribute("data-bg-color");
        input.style.backgroundColor = box.getAttribute("data-bg-color");
        box.style.color = "#fff";
      });

      box.addEventListener("dragleave", () => {
        box.style.backgroundColor = "#fff";
        input.style.backgroundColor = "#fff";
        box.style.color = "#000";
      });

      box.addEventListener("drop", () => {
        if (drag) {
          const oldBoxIndex = Array.from(boxes).findIndex((b) =>
            b.contains(drag)
          );
          container.appendChild(drag);
          box.style.backgroundColor = "#fff";
          input.style.backgroundColor = "#fff";
          box.style.color = "#000";

          // تحديث لون العنصر بناءً على الصندوق الذي تم إسقاطه فيه
          drag.style.backgroundColor = box.getAttribute("data-bg-color");

          // تحديث موقع العنصر في localStorage
          updateLocalStorage();
        }
      });
    });
  }

  function initializeTouchEvents(item) {
    item.addEventListener("touchstart", (e) => {
      item.style.opacity = "0.5";
      const touch = e.touches[0];
      const offsetX = touch.clientX - item.getBoundingClientRect().left;
      const offsetY = touch.clientY - item.getBoundingClientRect().top;

      function moveAt(touch) {
        item.style.position = "absolute";
        item.style.zIndex = "1000";
        item.style.left = touch.clientX - offsetX + "px";
        item.style.top = touch.clientY - offsetY + "px";
      }

      const touchMoveHandler = (e) => {
        moveAt(e.touches[0]);
      };

      document.addEventListener("touchmove", touchMoveHandler);

      item.addEventListener("touchend", () => {
        item.style.opacity = "1";
        document.removeEventListener("touchmove", touchMoveHandler);

        let droppedInBox = null;
        boxes.forEach((box) => {
          const boxRect = box.getBoundingClientRect();
          if (
            touch.clientX >= boxRect.left &&
            touch.clientX <= boxRect.right &&
            touch.clientY >= boxRect.top &&
            touch.clientY <= boxRect.bottom
          ) {
            droppedInBox = box;
          }
        });

        if (droppedInBox) {
          const container = droppedInBox.querySelector(".container");
          container.appendChild(item);
          updateLocalStorage();
        } else {
          item.style.position = "";
          item.style.zIndex = "";
        }
      });
    });
  }

  function updateLocalStorage() {
    const allItems = [];
    boxes.forEach((box, boxIndex) => {
      const container = box.querySelector(".container");
      container.querySelectorAll(".item").forEach((item) => {
        allItems.push({ text: item.textContent, boxIndex });
      });
    });
    localStorage.setItem("items", JSON.stringify(allItems));
  }

  // التعامل مع تعديل اسم البوكس
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputTitle = button.previousElementSibling;
      const toggleBtn = button;

      if (inputTitle.hasAttribute("readonly")) {
        inputTitle.removeAttribute("readonly");
        inputTitle.focus();
        toggleBtn.textContent = "👍";

        const saveChanges = () => {
          inputTitle.setAttribute("readonly", "");
          toggleBtn.textContent = "✏️";
          const boxIndex =
            Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
          localStorage.setItem(`box${boxIndex}`, inputTitle.value);
          document.removeEventListener("click", saveChanges);
        };

        inputTitle.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            saveChanges();
            e.preventDefault();
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !inputTitle.contains(event.target) &&
            !button.contains(event.target)
          ) {
            saveChanges();
          }
        });
      } else {
        inputTitle.setAttribute("readonly", "");
        toggleBtn.textContent = "✏️";
        const boxIndex =
          Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
        localStorage.setItem(`box${boxIndex}`, inputTitle.value);
      }
    });
  });
});
